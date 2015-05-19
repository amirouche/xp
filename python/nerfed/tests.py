from unittest import TestCase

from nerfed import Route
from nerfed import Imperator
from nerfed import InvalidRoute
from nerfed import InvalidPatternConversion


def debug():
    import ipdb
    ipdb.set_trace()


class TestImperator(TestCase):

    def test_imperator_init_with_keywords(self):

        @Imperator.with_properties
        class AnotherImperator(Imperator):

            zarname = Imperator.Property()
            name = Imperator.Property()
            yourname = Imperator.Property()

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.arguments = args
                self.options = kwargs

        a = AnotherImperator(zarname="foo", name="bar", yourname="spam")
        self.assertEqual(a.zarname, 'foo')
        self.assertEqual(a.name, 'bar')
        self.assertEqual(a.yourname, 'spam')

    def test_imperator_init_with_args(self):

        @Imperator.with_properties
        class AnotherImperator(Imperator):

            zarname = Imperator.Property()
            name = Imperator.Property()
            yourname = Imperator.Property()

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.arguments = args
                self.options = kwargs

        a = AnotherImperator("foo", "bar", "spam")
        self.assertEqual(a.zarname, 'foo')
        self.assertEqual(a.name, 'bar')
        self.assertEqual(a.yourname, 'spam')

    def test_imperator_init_with_args_and_keywords(self):

        @Imperator.with_properties
        class AnotherImperator(Imperator):

            zarname = Imperator.Property()
            name = Imperator.Property()
            yourname = Imperator.Property()

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.arguments = args
                self.options = kwargs

        a = AnotherImperator("foo", "bar", yourname="spam")
        self.assertEqual(a.zarname, 'foo')
        self.assertEqual(a.name, 'bar')
        self.assertEqual(a.yourname, 'spam')

        
class TestRouteClass(TestCase):

    sentinel = object()
    handler = lambda context, **infos: (sentinel, context, infos)

    def test_convert(self):
        self.assertEqual(Route.convert('int', '132'), 132)

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

    # the following test is tests that use mocks
    # they *reflect* actual use of the features
    def test_wrong_route_sub_but_fully_consumed_path(self):
        # method is None, when the route leads to a sub
        # a sub is a class, an object is used instead
        route = Route(None, '/path/to/something', object())
        out = route.match(
            object(),
            'whatever method',
            '/path/to/something',
            dict()
        )
        # no match
        self.assertEqual(out, (None, None, None))

    def test_match_fail_to_convert(self):
        route = Route('GET', '/object/<id:int>/do/something', object())
        out = route.match(
            object(),
            'GET',
            '/object/13.2/do/something',
            dict()
        )
        # no match
        self.assertEqual(out, (None, None, None))


class TestAppClass(TestCase):

    def test_index_resolve(self):
        from nerfed import App

        app = App()

        @app.route('GET', '/')
        def index(context, **infos):
            return 'Héllo'

        sub, handler, infos = app.resolve('GET', '/', {})
        self.assertEqual(handler, index.coroutine)

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
        self.assertEqual(handler, index.coroutine)

    def test_index_resolve_the_other_route(self):
        from nerfed import App

        app = App()

        @app.route('GET', '/')
        def index(context, **infos):
            return 'Héllo'  # FIXME: not correct return

        @app.route('GET', '/about')
        def about(context, **infos):
            return 'Héllo'  # FIXME: not correct return

        sub, handler, infos = app.resolve('GET', '/about', {})
        self.assertEqual(handler, about.coroutine)
