#!/bin/bash

glib-compile-schemas schemas/
zip -r libvirt-menu@extensions.gnome.nickewing.net.zip . --exclude=po/\* --exclude=.git/\* --exclude=*.sh --exclude=*.zip
