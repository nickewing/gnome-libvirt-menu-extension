const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const LibvirtMenu = Extension.imports.libvirtMenu;

let libvirtMenu;

function init() {
}

function enable() {
  libvirtMenu = new LibvirtMenu.LibvirtMenu();
  Main.panel.addToStatusArea("libvirtMenu", libvirtMenu, 1);
}

function disable() {
  libvirtMenu.destroy();
}
