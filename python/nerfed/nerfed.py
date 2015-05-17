#!/usr/bin/env python3
import asyncio
import aiohttp
from re import compile

from functools import wraps
from urllib.parse import urlparse
from urllib.parse import parse_qsl

from aiohttp.web import Request
from aiohttp.web import Response
from aiohttp.web import HTTPNotFound
from aiohttp.web import HTTPException
from aiohttp.web import StreamResponse

from aiohttp.multidict import MultiDict
from aiohttp.server import ServerHttpProtocol


class NerfedException(Exception):
    pass


class InvalidRoute(NerfedException):
    pass


class InvalidPatternConversion(NerfedException):
    pass


def debug(*args, **kwargs):
    import colorama
    args = list(args)
    args.insert(0, colorama.Fore.RED)
    args.append(kwargs)
    args.append(colorama.Fore.RESET)
    print(' '.join(list(map(lambda x: str(x), args))))


class Route:

    RE_DYNAMIC = compile(r'^<(?P<name>[^:>]+)(:(?P<kind>[^>]+))?>$')
    RE_NAMED_PART = r'(?P<%s>[^/]+)'

    def __init__(self, method, path, handler):
        if not path.startswith('/'):
            raise InvalidRoute("path must start with a slash '/'")
        self.method = method
        self.path = path
        self.handler = handler
        self.pattern, self.conversion = self._build_to_pattern()

    def _build_to_pattern(self):
        """Convert pattern path to regex patterns and converstion dict"""
        parts = self.path[1:].split('/')
        patterns = list()
        conversion = dict()
        names = list()
        for part in parts:
            match = Route.RE_DYNAMIC.match(part)
            if match:
                match = match.groupdict()
                name = match['name']
                if name in names:
                    # FIXME: this check on all routes before
                    # the server starts
                    msg = 'Invalid route, pattern named %s already exists'
                    msg = msg % name
                    raise InvalidRoute(msg)
                names.append(name)
                pattern = Route.RE_NAMED_PART % name
                patterns.append(pattern)
                kind = match['kind']
                if kind:
                    conversion[name] = match['kind']
            else:
                # not a dynamic url
                patterns.append(part)
        pattern = '/'.join(patterns)

        if self.path.endswith('/'):
            pattern += '/'
        if len(self.path) > 1:
            pattern = '/' + pattern

        pattern = '^' + pattern
        if self.method is not None:
            pattern += '$'

        pattern = compile(pattern)
        return pattern, conversion

    @staticmethod
    def convert(kind, value):
        """Convert 'value' to a python value based on 'kind'

        Only support 'int', override this method to support
        more conversion.

        If this method raise an exception, a 404 error is
        returned to the client.
        """
        if kind == 'int':
            return int(value)
        else:
            msg = ('%s is not supported conversion format'
                   'you can add it by overriding Router.convert')
            msg = msg % kind
            raise InvalidPatternConversion(msg)

    def match(self, sub, method, path, infos):
        """match path against this route

        This is return `sub`, ``handler`` and ``infos`` if there is a match,
        ``(None, None, None)`` otherwise"""
        match = self.pattern.match(path)
        if match:
            if self.method and match.endpos != match.end():
                # this is not a sub route and the path is not fully consumed
                return None, None, None
            elif not self.method and match.endpos == match.end():
                # this is a sub route and the path is fully consumed
                return None, None, None
            else:
                moreinfos = match.groupdict()
                convert = lambda item: (
                    item[0],
                    self.convert(item[1], moreinfos[item[0]])
                )
                try:
                    native = map(convert, self.conversion.items())
                except Exception:
                    # failing to convert some part of the url, not a match
                    return None, None, None
                else:
                    # override old values with python values
                    infos = dict(infos)
                    infos.update(moreinfos)
                    infos.update(native)
                    path = path[match.end():]
                    if path:
                        assert self.method is None
                        # there is more path to match
                        return self.handler.resolve(method, path, infos)
                    else:
                        assert self.method is not None
                        # path is a full match
                        return sub, self.handler, infos
        else:
            return None, None, None


class Context:
    """Context is a request context holding values
    related to current request.

    - app: the current running app
    - sub: the sub against which the handler was registred
    - request: aiohttp request object
    - websocket: aiohttp.web.WebSocketResponse if this is a
      websocket request, otherwise None.
    """
    def __init__(self, app, sub, request):
        self.app = app
        self.sub = sub
        self.request = request
        self.websocket = None


class Sub:
    """A (reusable) component of an app"""

    def __init__(self, settings=None):
        super().__init__()
        self._parent = None
        self._routes = list()
        self.settings = settings if settings else dict()

        for name in dir(self):
            attribute = getattr(self, name)
            if callable(attribute) and getattr(attribute, 'is_route', False):
                self.add_route(attribute.method, attribute.path, attribute)

    def app(self):
        if self._parent:
            return self._parent.app()
        else:
            return self

    def route(self, method, path):
        """Use this method as decorator to declare a route against this Sub"""
        def wrapper(func):
            coro = asyncio.coroutine(func)
            func.coroutine = coro
            self.add_route(method, path, coro)
            return func
        return wrapper

    def webosocket_route(self, method, path):
        """Use this method as decorator to declare a route against this Sub"""
        def wrapper(func):
            func.is_route = True
            func.method = method
            func.path = path
            func = self._wrap_websocket_handler(func)
            return func
        return wrapper

    def add_sub(self, path, sub):
        """Programmatically add a sub to this sub"""
        sub._parent = self
        self.add_route(None, path, sub)
        return sub

    def add_route(self, method, path, handler):
        """Programmatically add a route to this sub"""
        route = Route(method, path, handler)
        self._routes.append(route)

    def _wrap_websocket_handler(self, func):
        """Wrap func to initiate websocket request if possible.

        Adds WebSocketReponse instance to context as context.websocket"""
        @wraps(func)
        def wrapper(context, **kwargs):
            response = WebSocketResponse()
            ok, protocol = resp.can_start(request)
            if not ok:
                raise HTTPBadRequest()
            else:
                response.start(context.request)
                context.websocket = response
                return func(context, **kwarg)
        return wrapper

    def add_websocket_route(self, method, path, handler):
        """Programmatically add a websocket route to this sub"""
        wrapped = self._wrap_websocket_handler(handler)
        self.add_route(method, path, wrapped)

    def resolve(self, method, path, infos):
        """Look for a route matching 'method' and 'path'.

        Returns 'sub', 'handler', 'infos', where handler is attached
        to sub. 'infos' holds matched url variables."""
        for route in self._routes:
            if route.method and route.method != method:
                continue
            match = route.match(self, method, path, infos)
            if match[0]:
                return match
        return None, None, None

    def reverse(self, sub, name, **infos):
        pass


class App(Sub, ServerHttpProtocol):

    METHODS = {'POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'}

    middlewares = list()

    @classmethod
    def make(cls):
        """Instantiate this class.

        Used as an asyncio callback."""
        return cls()

    @asyncio.coroutine
    def handle_request(self, message, payload):
        """Asyncio callback resolving request to a handler.

        Calls handler and returns its response if any or a 404 HTTP error."""
        # current "loop time"
        now = self._loop.time()
        request = Request(
            self,
            message,
            payload,
            self.transport,
            self.reader,
            self.writer
        )
        sub, handler, infos = self.resolve(request.method, request.path, dict())
        debug('handling %s, resolved: %s %s %s' % (request.path, sub, handler, infos))

        if sub:
            try:
                context = Context(self, sub, request)
                response = yield from handler(context, **infos)

                if not isinstance(response, StreamResponse):
                    msg = ("Handler {!r} should return response instance, "
                           "got {!r} [middlewares {!r}]")
                    msg = msg.format(
                        {},  # match_info.handler,
                        type(response),
                        self.middlewares
                    )
                    raise RuntimeError(msg)
            except HTTPException as exc:
                response = exc
        else:
            response = HTTPNotFound()

        debug(response)
        response_message = response.start(request)
        yield from response.write_eof()

        # notify server about keep-alive
        self.keep_alive(response_message.keep_alive())

        # log access
        self.log_access(
            message,
            None,
            response_message,
            self._loop.time() - now
        )


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    app = App()

    @app.route('GET', '/')
    def hello(context, **infos):
        return Response(body='Héllo'.encode('utf-8'))

    f = loop.create_server(
        lambda: app,
        '0.0.0.0',
        '8000',
    )
    srv = loop.run_until_complete(f)
    print('serving on', 'http://{}:{}'.format(*srv.sockets[0].getsockname()))
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
