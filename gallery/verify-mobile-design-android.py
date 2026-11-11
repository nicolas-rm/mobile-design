"""Smoke tests against the Mobile Design gallery already open on Android."""

import argparse
import re
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from xml.etree import ElementTree


CATALOG = 'md-catalog-list'
QUERY = 'md-catalog-query'
CLEAR_QUERY = 'md-catalog-query-clear-icon'
GALLERY_BACK = 'md-gallery-back'


class SmokeError(RuntimeError):
    pass


class StateTimeout(SmokeError):
    pass


def find(tree, test_id):
    return next((node for node in tree.iter('node') if node.get('resource-id', '').rsplit('/', 1)[-1] == test_id), None)


def bounds(node):
    if node is None:
        return None
    values = re.findall(r'-?\d+', node.get('bounds', ''))
    if len(values) != 4:
        return None
    left, top, right, bottom = map(int, values)
    if right > left and bottom > top:
        return left, top, right, bottom
    return None


class Gallery:
    def __init__(self, serial):
        self.serial = serial
        self.dump_path = f'/data/local/tmp/mobile-design-{uuid.uuid4().hex}.xml'
        self.dump_requested = False

    def adb(self, *args, timeout=12):
        command = ['adb', '-s', self.serial, *map(str, args)]
        try:
            return subprocess.run(command, check=True, capture_output=True, timeout=timeout).stdout
        except FileNotFoundError as error:
            raise SmokeError('No se encontró adb en el PATH.') from error
        except subprocess.TimeoutExpired as error:
            raise SmokeError(f'ADB agotó el tiempo de espera para {args[0]}.') from error
        except subprocess.CalledProcessError as error:
            detail = (error.stderr or error.stdout).decode(errors='replace').strip()
            raise SmokeError(f'ADB {args[0]} falló con código {error.returncode}. {detail}') from error

    def wait(self, description, matches, timeout=12):
        deadline = time.monotonic() + timeout
        self.dump_requested = True
        while time.monotonic() < deadline:
            result = self.adb('shell', 'uiautomator', 'dump', self.dump_path)
            if b'dumped to:' in result:
                xml = self.adb('exec-out', 'cat', self.dump_path)
                tree = ElementTree.fromstring(xml)
                if matches(tree):
                    return tree
            time.sleep(.2)
        raise StateTimeout(description)

    def tap(self, node):
        target = bounds(node)
        if target is None or node.get('enabled') == 'false':
            raise SmokeError('El control para tocar está fuera de la pantalla o deshabilitado.')
        left, top, right, bottom = target
        self.adb('shell', 'input', 'tap', (left + right) // 2, (top + bottom) // 2)
        time.sleep(.3)

    def back(self):
        self.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')

    def swipe(self, start, end, duration):
        self.adb('shell', 'input', 'swipe', *start, *end, duration)
        time.sleep(.4)

    def reveal(self, test_id, viewport, destination, description, toward_start):
        for _ in range(7):
            tree = self.wait(description, lambda current: destination(current) or bounds(find(current, viewport)))
            if destination(tree):
                return tree
            area = bounds(find(tree, test_id))
            if area is not None and area[3] - area[1] >= 24:
                return tree
            left, top, right, bottom = bounds(find(tree, viewport))
            height = bottom - top
            if toward_start:
                x = left + (right - left) * 3 // 5
                self.swipe((x, top + height // 5), (x, top + height * 4 // 5), 400)
            else:
                x = left + (right - left) // 12
                self.swipe((x, top + height * 3 // 4), (x, top + height // 4), 400)
        raise SmokeError(f'No se pudo desplazar hasta {test_id}.')

    def open(self, trigger, viewport, destination, description, *, toward_start=False):
        for attempt in range(2):
            tree = self.reveal(trigger, viewport, destination, description, toward_start)
            if destination(tree):
                return tree
            self.tap(find(tree, trigger))
            try:
                return self.wait(description, destination, timeout=5)
            except StateTimeout:
                if attempt == 1:
                    raise

    def catalog(self):
        return self.wait(
            'Abre el catálogo de Mobile Design con la búsqueda visible y el filtro «Todos».',
            lambda tree: bounds(find(tree, CATALOG)) and bounds(find(tree, QUERY)),
        )

    def open_family(self, family):
        tree = self.catalog()
        query = find(tree, QUERY)
        if query.get('text', '').lower() != family:
            if find(tree, CLEAR_QUERY) is not None:
                tree = self.open(
                    CLEAR_QUERY,
                    CATALOG,
                    lambda current: bounds(find(current, QUERY)) and find(current, CLEAR_QUERY) is None,
                    'El catálogo no borró la búsqueda anterior.',
                )
                query = find(tree, QUERY)
            self.tap(query)
            self.wait(
                'El campo de búsqueda no recibió el foco.',
                lambda current: (field := find(current, QUERY)) is not None and field.get('focused') == 'true',
            )
            self.adb('shell', 'input', 'text', family)
            self.wait(
                f'La búsqueda no recibió «{family}».',
                lambda current: (field := find(current, QUERY)) is not None and field.get('text', '').lower() == family,
            )
        if b'mInputShown=true' in self.adb('shell', 'dumpsys', 'input_method'):
            self.back()
        viewport = f'md-detail-{family}'
        self.open(f'md-catalog-{family}', CATALOG, lambda current: bounds(find(current, viewport)), f'No se abrió {viewport}.')
        return viewport

    def return_to_catalog(self, tree):
        self.tap(find(tree, GALLERY_BACK))
        self.catalog()

    def save_failure(self):
        screenshot = self.adb('exec-out', 'screencap', '-p', timeout=5)
        if not screenshot.startswith(b'\x89PNG\r\n\x1a\n'):
            raise SmokeError('El emulador no devolvió una captura PNG.')
        directory = Path(tempfile.mkdtemp(prefix='mobile-design-android-'))
        path = directory / 'failure.png'
        path.write_bytes(screenshot)
        return path


def check_card(gallery):
    viewport = gallery.open_family('cards')
    close = 'md-card-details-close'
    dialog = 'md-card-details'
    opened = gallery.open(
        'md-card-contained', viewport, lambda tree: bounds(find(tree, close)), 'Card filled no abrió su detalle.'
    )
    details = find(opened, dialog)
    if details is None or details.get('content-desc') != 'Museos del centro':
        raise SmokeError('El detalle de Card filled no corresponde a «Museos del centro».')
    gallery.back()
    returned = gallery.wait(
        'Atrás no cerró el detalle de Card filled.',
        lambda tree: find(tree, close) is None and bounds(find(tree, viewport)),
    )
    gallery.return_to_catalog(returned)


def check_menu(gallery):
    viewport = gallery.open_family('menus')
    trigger = 'md-menu-phone-open'
    popup = 'md-menu-phone'
    choice = 'md-menu-phone-smartphone'
    value = 'md-menu-phone-value'

    def visible_menu(tree):
        return bounds(find(tree, popup)) and bounds(find(tree, choice))

    def closed_with(label):
        def matches(tree):
            current = find(tree, value)
            return find(tree, popup) is None and current is not None and current.get('text') == label and bounds(find(tree, viewport))

        return matches

    gallery.open(trigger, viewport, visible_menu, 'IconButton no abrió el menú de teléfono.')
    gallery.back()
    gallery.wait('Atrás no cerró el menú conservando «Trabajo».', closed_with('Trabajo'))
    reopened = gallery.open(trigger, viewport, visible_menu, 'IconButton no volvió a abrir el menú de teléfono.')
    gallery.tap(find(reopened, choice))
    selected = gallery.wait('Elegir «Móvil» no actualizó el teléfono y cerró el menú.', closed_with('Móvil'))
    gallery.return_to_catalog(selected)


def open_list_example(gallery, lists, example, destination, description, *, toward_start=False):
    menu = 'md-list-usage-menu-scroll'
    gallery.open(
        'md-list-usage-fab',
        lists,
        lambda tree: bounds(find(tree, menu)) and bounds(find(tree, 'md-list-usage-open-mailbox')),
        'Lists no abrió su menú de ejemplos.',
    )
    return gallery.open(f'md-list-usage-open-{example}', menu, destination, description, toward_start=toward_start)


def check_inbox(gallery, lists, require_scroll):
    inbox = 'list-messages'
    count = 'list-message-count'
    row = 'list-message-trip-item-primary'
    more = 'list-message-trip-more'
    action = 'list-message-trip-trailing-save'
    close = 'list-message-trip-close'

    initial = open_list_example(
        gallery,
        lists,
        'mailbox',
        lambda tree: bounds(find(tree, inbox)) and bounds(find(tree, row)) and bounds(find(tree, more)) and find(tree, count) is not None,
        'Inbox no mostró la lista, la fila del viaje y su contador.',
    )
    count_before = find(initial, count).get('text')
    if not count_before or find(initial, action) is not None or find(initial, close) is not None:
        raise SmokeError('Inbox debe comenzar con su contador visible y las acciones de la fila cerradas.')

    densities = re.findall(rb'(?:Physical|Override) density: (\d+)', gallery.adb('shell', 'wm', 'density'))
    if not densities:
        raise SmokeError('No se pudo leer la densidad de la pantalla Android.')
    scale = int(densities[-1]) / 160
    left, top, right, bottom = bounds(find(initial, row))
    width = right - left
    more_left, _, more_right, _ = bounds(find(initial, more))
    trailing_on_right = more_left + more_right > left + right
    direction = -1 if trailing_on_right else 1
    inset = width // 5
    x = right - inset if trailing_on_right else left + inset
    y = (top + bottom) // 2
    # Open the three trailing actions without dragging far enough to commit one.
    distance = min(width * 2 // 5, round(155 * scale))
    gallery.swipe((x, y), (x + direction * distance, y), 520)
    opened = gallery.wait(
        'El swipe parcial de Inbox no reveló las acciones de la fila del viaje.',
        lambda tree: all(bounds(find(tree, key)) for key in (inbox, row, action, close)),
    )
    print('PASS Inbox revela las acciones con un swipe parcial', flush=True)

    list_left, list_top, list_right, list_bottom = bounds(find(opened, inbox))
    last_row = bounds(find(opened, 'list-message-invite-item-primary'))
    if last_row is not None and list_bottom - last_row[3] >= round(56 * scale):
        message = 'Inbox muestra los siete mensajes sin desplazamiento. Usa una pantalla Android más corta para probar el scroll.'
        if require_scroll:
            raise SmokeError(message)
        print(f'SKIP {message}', flush=True)
        finished = opened
    else:
        _, row_top, _, _ = bounds(find(opened, row))
        distance = min(round(65 * scale), (row_top - list_top) // 2)
        if distance <= round(12 * scale):
            raise SmokeError('La fila del viaje está demasiado cerca del borde superior para verificar el scroll.')
        x = list_left + (list_right - list_left) * 2 // 5
        y = list_top + (list_bottom - list_top) * 4 // 5
        gallery.swipe((x, y), (x, y - distance), 550)

        def moved_and_closed(tree):
            moved = bounds(find(tree, row))
            return (
                moved is not None
                and moved[1] < row_top
                and moved[2] - moved[0] == width
                and find(tree, close) is None
                and find(tree, action) is None
            )

        finished = gallery.wait('El scroll de Inbox no movió la misma fila con sus acciones cerradas.', moved_and_closed)
        print('PASS El scroll de Inbox mueve la fila visible y cierra sus acciones', flush=True)

    counter = find(finished, count)
    if counter is None or counter.get('text') != count_before:
        raise SmokeError('El gesto de Inbox cambió el contador de mensajes.')
    gallery.tap(find(finished, 'md-list-context-bar-navigation'))
    gallery.wait('No se volvió a Lists desde Inbox.', lambda tree: bounds(find(tree, lists)))


def check_favorites(gallery, lists):
    screen = 'md-list-use-reorder'
    first = 'md-list-favorites-reorder-strangers-handle'
    second = 'md-list-favorites-reorder-21st-century-strangers-handle'

    def in_slot(tree, handle, position):
        node = find(tree, handle)
        return bounds(node) and node.get('content-desc', '').endswith(f', {position} of 4')

    initial = open_list_example(
        gallery,
        lists,
        'reorder',
        lambda tree: bounds(find(tree, screen)) and in_slot(tree, first, 1) and in_slot(tree, second, 2),
        'Favorites no mostró las dos primeras filas en su orden inicial.',
        toward_start=True,
    )
    first_left, first_top, first_right, first_bottom = bounds(find(initial, first))
    _, second_top, _, second_bottom = bounds(find(initial, second))
    if first_bottom > second_top:
        raise SmokeError('El orden visible inicial de Favorites no coincide con sus posiciones accesibles.')

    x = (first_left + first_right) // 2
    first_y = (first_top + first_bottom) // 2
    second_y = (second_top + second_bottom) // 2
    target_y = min(second_bottom - 1, second_y + (second_y - first_y) // 10)
    gallery.swipe((x, first_y), (x, target_y), 750)

    def reordered(tree):
        return (
            in_slot(tree, first, 2)
            and in_slot(tree, second, 1)
            and abs(bounds(find(tree, first))[1] - second_top) <= 2
            and abs(bounds(find(tree, second))[1] - first_top) <= 2
        )

    gallery.wait('Favorites no confirmó el intercambio visible y accesible de las dos filas.', reordered)
    gallery.back()
    returned = gallery.wait(
        'Atrás no volvió a Lists desde Favorites.',
        lambda tree: find(tree, screen) is None and bounds(find(tree, lists)),
    )
    gallery.return_to_catalog(returned)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('serial', help='Android serial from adb devices')
    parser.add_argument('--require-inbox-scroll', action='store_true', help='Fail if Inbox fits without scrolling')
    options = parser.parse_args()
    gallery = Gallery(options.serial)
    step = 'Conectar con Android'
    connected = False
    try:
        connected = gallery.adb('get-state').strip() == b'device'
        if not connected:
            raise SmokeError('El dispositivo indicado no está listo.')
        for step, check in [('Card filled y Atrás', check_card), ('IconButton, Menu y selección', check_menu)]:
            check(gallery)
            print(f'PASS {step}', flush=True)
        step = 'Inbox y contador de mensajes'
        lists = gallery.open_family('lists')
        check_inbox(gallery, lists, options.require_inbox_scroll)
        print(f'PASS {step}', flush=True)
        step = 'Favorites y posiciones accesibles'
        check_favorites(gallery, lists)
        print(f'PASS {step}', flush=True)
    except (SmokeError, ElementTree.ParseError) as error:
        print(f'FAIL {step}. {error}', file=sys.stderr)
        if connected:
            try:
                print(f'Captura: {gallery.save_failure()}', file=sys.stderr)
            except (SmokeError, OSError) as capture_error:
                print(f'No se pudo guardar la captura. {capture_error}', file=sys.stderr)
        return 1
    finally:
        if gallery.dump_requested:
            try:
                gallery.adb('shell', 'rm', '-f', gallery.dump_path, timeout=5)
            except SmokeError as error:
                print(f'No se pudo retirar el XML temporal. {error}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
