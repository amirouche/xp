from kivy.app import App

from kivy.clock import Clock

from kivy.core.window import Window
from kivy.core.text import Label as Text

from kivy.properties import ListProperty
from kivy.properties import NumericProperty
from kivy.properties import AliasProperty

from kivy.logger import Logger

from kivy.uix.layout import Layout
from kivy.uix.relativelayout import RelativeLayout
from kivy.uix.floatlayout import FloatLayout


from kivy.uix.popup import Popup
from kivy.uix.label import Label
from kivy.uix.bubble import Bubble
from kivy.uix.widget import Widget
from kivy.uix.scatter import Scatter

from kivy.graphics import Color
from kivy.graphics import Canvas
from kivy.graphics import ClearColor

from kivy.graphics.vertex_instructions import Bezier, BorderImage, Ellipse, \
    GraphicException, Line, Mesh, Point, Quad, Rectangle, Triangle

from kivy.interactive import InteractiveLauncher

from kivy.core.image import load as load_image
from kivy.resources import resource_find
from kivy.properties import StringProperty


class Marker(Scatter):

    def __init__(self, grid, **kwargs):
        super(Marker, self).__init__(**kwargs)
        bubble = Bubble(arrow_pos='left_bottom')
        self.label = Label()
        bubble.add_widget(self.label)
        self.add_widget(bubble)
        self.grid = grid
        self.update_text()

    def on_transform_with_touch(self, touch):
        self.update_text()

    def update_text(self, *args):
        x = -int(self.grid.origin_x - self.x)
        y = -int(self.grid.origin_y - self.y)
        text = repr((x, y))
        self.label.text = text


class PatternBackgroundTexture(Rectangle):  # inspired from kivy.uix.Image

    def __init__(self, file_path, **kwargs):
        super(PatternBackgroundTexture, self).__init__(**kwargs)
        self.source = source


class Grid(Widget):

    __events__ = ('on_origin_move_with_touch',)

    origin_x = NumericProperty(0.0)
    origin_y = NumericProperty(0.0)

    # setting up ``origin`` position alias

    def get_origin(self):
        return (self.origin_x, self.origin_y)

    def set_origin(self, value):
        self.origin_x = value[0]
        self.origin_y = value[1]

    origin = AliasProperty(
        get_origin, set_origin, bind=('origin_x', 'origin_y'))

    def __init__(self, **kwargs):
        self.do_collide_after_children = False  # not used yet
        super(Grid, self).__init__(**kwargs)

        self.bind(
            size=self.redraw,
            origin=self.redraw,
        )

        # init datastructures required to handle touch events
        self._touches = list()
        self._last_touch_pos = dict()

        # init swag texture
        self.background_texture_pattern = load_image(
            './static/darknoise.png').texture

    def redraw(self, *args):
        self.canvas.clear()
        with self.canvas:
            width = self.parent.width
            height = self.parent.height

            # setup background
            # fill with pattern texture
            texture = self.background_texture_pattern
            w = texture.width
            h = texture.height
            x_repeat = int(width / w) + 1
            y_repeat = int(height / h) + 1

            for x_step in range(x_repeat):
                for y_step in range(y_repeat):
                    x = x_step * w
                    y = y_step * h
                    Rectangle(texture=texture, pos=(x, y), size=(w, h))

            #

            x0 = self.origin[0]
            y0 = self.origin[1]

            step = 50.0  # in pixels

            # verticals
            number_of_lines = int(width / step)

            current_x = (x0 % step)
            delta_x = current_x - x0
            dashed = bool(delta_x % 100)
            for i in range(number_of_lines):
                if dashed:
                    Color(52 / 255, 101 / 255, 154 / 255, 1)
                    Line(
                        points=(current_x, 0, current_x, height),
                        width=1,
                        dash_length=10,
                        dash_offset=10,
                    )
                else:
                    Color(52 / 255, 101 / 255, 154 / 255, 0.5)
                    Line(points=(current_x, 0, current_x, height), width=1)
                    # this can be avoided
                    if delta_x != 0:
                        Color(114 / 255, 159 / 255, 207 / 255, 1)
                        text = Text()
                        text.text = str(delta_x)
                        text.refresh()   # force rendering
                        Rectangle(
                            texture=text.texture,
                            size=text.size,
                            pos=(current_x + 5, y0 + 5),
                        )

                dashed = not dashed
                current_x += step
                delta_x += step

            # draw origin y axis
            # Color(114/255, 159/255, 207/255, 1)
            Color(1, 1, 1)
            Line(points=(x0, 0, x0, height), width=1)

            # horizontals
            # XXX: without + 1 top line is missing
            number_of_lines = int(height / step) + 1

            current_y = (y0 % step)
            delta_y = current_y - y0
            dashed = bool(delta_y % 100)
            for i in range(number_of_lines):
                Color(52 / 255, 101 / 255, 154 / 255, 1)
                if dashed:
                    Line(
                        points=(0, current_y, width, current_y),
                        width=1,
                        dash_length=10,
                        dash_offset=10,
                    )
                else:
                    Line(points=(0, current_y, width, current_y), width=1)
                    # this can be avoided
                    if delta_y != 0:
                        Color(114 / 255, 159 / 255, 207 / 255, 1)
                        text = Text()
                        text.text = str(delta_y)
                        text.refresh()   # force rendering
                        Rectangle(
                            texture=text.texture,
                            size=text.size,
                            pos=(x0 + 5, current_y + 5),
                        )

                dashed = not dashed
                current_y += step
                delta_y += step

            # draw origin x axis
            Color(1, 1, 1)
            Line(points=(0, y0, width, y0), width=1)

            Color(0 / 255, 0 / 255, 255 / 255, 0.3)
            Rectangle(size=self.size)
            
        for child in self.children:
            self.canvas.add(child.canvas)

    # methods that handle moving origin (stolen from kivy.uix.scatter
    def on_touch_down(self, touch):
        x, y = touch.x, touch.y

        # if the touch isnt on the widget we do nothing
        if not self.do_collide_after_children:
            if not self.collide_point(x, y):
                return False

        # let the child widgets handle the event if they want
        touch.push()
        touch.apply_transform_2d(self.to_local)
        if super(Grid, self).on_touch_down(touch):
            touch.pop()
            return True
        touch.pop()

        if self.do_collide_after_children:
            if not self.collide_point(x, y):
                return False

        # grab the touch so we get all it later move events for sure
        touch.grab(self)
        self._touches.append(touch)
        self._last_touch_pos[touch] = touch.pos

        return True

    def on_touch_move(self, touch):
        x, y = touch.x, touch.y

        # let the child widgets handle the event if they want
        if self.collide_point(x, y) and not touch.grab_current == self:
            touch.push()
            touch.apply_transform_2d(self.to_local)
            if super(Grid, self).on_touch_move(touch):
                touch.pop()
                return True
            touch.pop()

        # rotate/scale/translate
        if touch in self._touches and touch.grab_current == self:
            if self.move_origin_with_touch(touch):
                self.dispatch('on_origin_move_with_touch', touch)
            self._last_touch_pos[touch] = touch.pos

        # stop propagating if its within our bounds
        if self.collide_point(x, y):
            return True

    # was kivy.uix.Scatter.transform_with_touch
    def move_origin_with_touch(self, touch):
        # just do a simple one finger drag
        changed = False
        if len(self._touches):
            # _last_touch_pos has last pos in correct parent space,
            # just like incoming touch
            dx = (touch.x - self._last_touch_pos[touch][0])
            dy = (touch.y - self._last_touch_pos[touch][1])
            # self.translation_touches  # == min number of touch before a move
            dx = dx / 1
            dy = dy / 1  # self.translation_touches
            self.origin_x += dx
            self.origin_y += dy
            # move every child...
            for child in self.children:
                child.x += dx
                child.y += dy
            return True

        # if len(self._touches) == 1:
        #     return changed

        # with the above implementation, the will always move on first touch

        # # we have more than one touch... list of last known pos
        # points = [Vector(self._last_touch_pos[t]) for t in self._touches
        #           if t is not touch]
        # # add current touch last
        # points.append(Vector(touch.pos))

        # # we only want to transform if the touch is part of the two touches
        # # farthest apart! So first we find anchor, the point to transform
        # # around as another touch farthest away from current touch's pos
        # anchor = max(points[:-1], key=lambda p: p.distance(touch.pos))

        # # now we find the touch farthest away from anchor, if its not the
        # # same as touch. Touch is not one of the two touches used to transform
        # farthest = max(points, key=anchor.distance)
        # if farthest is not points[-1]:
        #     return changed

        # # ok, so we have touch, and anchor, so we can actually compute the
        # # transformation
        # old_line = Vector(*touch.ppos) - anchor
        # new_line = Vector(*touch.pos) - anchor
        # if not old_line.length():   # div by zero
        #     return changed

        # angle = radians(new_line.angle(old_line)) * self.do_rotation
        # self.apply_transform(Matrix().rotate(angle, 0, 0, 1), anchor=anchor)

        # if self.do_scale:
        #     scale = new_line.length() / old_line.length()
        #     new_scale = scale * self.scale
        #     if new_scale < self.scale_min:
        #         scale = self.scale_min / self.scale
        #     elif new_scale > self.scale_max:
        #         scale = self.scale_max / self.scale
        #     self.apply_transform(Matrix().scale(scale, scale, scale),
        #                          anchor=anchor)
        #     changed = True
        # return changed

    def on_touch_up(self, touch):
        x, y = touch.x, touch.y
        # if the touch isnt on the widget we do nothing, just try children
        if not touch.grab_current == self:
            touch.push()
            touch.apply_transform_2d(self.to_local)
            if super(Grid, self).on_touch_up(touch):
                touch.pop()
                return True
            touch.pop()

        # remove it from our saved touches
        if touch in self._touches and touch.grab_state:
            touch.ungrab(self)
            del self._last_touch_pos[touch]
            self._touches.remove(touch)

        if touch.is_double_tap and touch.grab_current == self:
            marker = Marker(self, pos=touch.pos)
            self.add_widget(marker)

        # stop propagating if its within our bounds
        if self.collide_point(x, y):
            return True

    def on_origin_move_with_touch(self, touch):
        pass


class Blueprint(App):

    def build(self):
        grid = Grid(origin=(500, 500))
        return grid


Blueprint().run()  # xor the thing below

# i = InteractiveLauncher(Blueprint())

# start with ipython -i main.py
# then type i.run() in ipython to display the window
# then start kiving
