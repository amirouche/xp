import asyncio


from nerfed import App
from aiohttp import Response

app = App()


# flask style app
@app.route('GET', '/')
def hello(context, **infos):
    return Response(body='Héllo'.encode('utf-8'))


# kind of django style
@asyncio.coroutine
def another(context, **infos):
    return Response(body='Another'.encode('utf-8'))

app.add_route('GET', '/another', hello)


# Class style
class MyApp(App):

    def __init__(self, *args, **kwargs):
        super().__init_(*args, **kwargs)
        self.add_route('GET', '/', self.hello)

    @asyncio.coroutine
    def hello(self, context, **infos):
        return Response(body='Héllo, World!'.encode('utf-8'))


# Second class style
class MyOtherApp(App):

    @App.make_route('GET', '/')
    def hello(self, context, **infos):
        return Response(body='Héllo, World!'.encode('utf-8'))


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
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
