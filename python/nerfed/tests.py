from unittest import TestCase

from nerfed import Route
from nerfed import InvalidRoute
from nerfed import InvalidPatternConversion


def debug():
    import ipdb
    ipdb.set_trace()


class TestRouteClass(TestCase):

    sentinel = object()
    handler = lambda context, **infos: (sentinel, context, infos)

    def test_duplicate_pattern_route(self):
        self.assertRaises(
            InvalidRoute,
            lambda: Route('GET', '/<name>/<name>', self.handler)
        )

    def test_invalid_route(self):
        self.assertRaises(
            InvalidRoute,
            lambda: Route('GET', '<name>/you-name-it', self.handler)
        )

    def test_index_route(self):
        route = Route('GET', '/', self.handler)
        self.assertEqual(route.match(self.sentinel, 'GET', '/', {})[0], self.sentinel)

    def test_index_route_fail(self):
        route = Route('GET', '/foo', self.handler)
        self.assertNotEqual(route.match(self.sentinel, 'GET', '/', {})[0], self.sentinel)

    def test_static_route(self):
        route = Route('GET', '/static', self.handler)
        self.assertEqual(route.match(self.sentinel, 'GET', '/static', {})[0], self.sentinel)

    def test_static_route_fail(self):
        route = Route('GET', '/static/fail', self.handler)
        self.assertNotEqual(route.match(self.sentinel, 'GET', '/static', {})[0], self.sentinel)

    def test_one_pattern(self):
        route = Route('GET', '/dynamique/<part>', self.handler)
        sub, _, infos = route.match(
            self.sentinel,
            'GET',
            '/dynamique/something', {}
        )
        self.assertEqual(sub, self.sentinel)
        self.assertEqual(infos, {'part': 'something'})

    def test_one_integer_pattern(self):
        route = Route('GET', '/dynamique/<part:int>', self.handler)
        sub, _, infos = route.match(
            self.sentinel,
            'GET',
            '/dynamique/132', {}
        )
        self.assertEqual(sub, self.sentinel)
        self.assertEqual(infos, {'part': 132})

    def test_one_integer_pattern_failed_to_convert(self):
        route = Route('GET', '/dynamique/<part:int>', self.handler)
        sub, _, infos = route.match(
            self.sentinel,
            'GET',
            '/pattern/abc', {}
        )
        self.assertEqual(None, sub)

    def test_invalid_convert_pattern(self):
        route = Route('GET', '/<frequence:float>', self.handler)
        self.assertRaises(
            InvalidPatternConversion,
            lambda:route.match(self.sentinel, 'GET', '/2.006', {})[0]
        )



class TestAppClass(TestCase):

    def test_index_resolve(self):
        from nerfed import App

        app = App()

        @app.route('GET', '/')
        def index(context, **infos):
            return 'Héllo'

        sub, handler, infos = app.resolve('GET', '/', {})
        self.assertEqual(handler, index)

    def test_index_resolve_with_two_routes(self):
        from nerfed import App

        app = App()

        @app.route('GET', '/')
        def index(context, **infos):
            return 'Héllo'  # FIXME: not correct return

        @app.route('GET', '/about')
        def about(context, **infos):
            return 'Héllo'  # FIXME: not correct return

        sub, handler, infos = app.resolve('GET', '/', {})
        self.assertEqual(handler, index)
