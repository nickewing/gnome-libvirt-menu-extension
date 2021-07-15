/* exported LibvirtMenu */

const {St, GLib, Clutter} = imports.gi;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const ByteArray = imports.byteArray;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Util = Extension.imports.util;

const SHUT_OFF = "shut off";
const RUNNING = "running";
const PAUSED = "paused";

const SETTINGS_SCHEMA = "org.gnome.shell.extensions.libvirt-menu";
const SETTINGS_VIRSH_COMMAND = "virsh-command";
const SETTINGS_VIRT_MANAGER_ENABLED = "virt-manager-enabled";
const SETTINGS_VIRT_MANAGER_COMMAND = "virt-manager-command";
const SETTINGS_ICON_THEME = "icon-theme";
const SETTINGS_ACTIVITY_HIGHLIGHT_COLOR = "activity-highlight-color";

const SETTINGS_ICON_THEME_NONE = 0;
const SETTINGS_ICON_THEME_BRIGHT = 1;
const SETTINGS_ICON_THEME_DARK = 2;

function convertColor(hex){
  let chunks = [];
  let tmp, i;
  hex = hex.substr(1);

  if (hex.length === 3) {
    tmp = hex.split("");
    for (i=0; i < 3; i++){
      chunks.push(parseInt(tmp[i] + "" + tmp[i], 16));
    }
  } else if (hex.length === 6){
    tmp = hex.match(/.{2}/g);
    for (i=0; i < 3; i++){
      chunks.push(parseInt(tmp[i],16));
    }
  } else {
    return [false, null];
  }

  return [true, chunks];
}

class LibvirtMenuClass extends PanelMenu.Button {

  _vmMenuItemText(vm) {
    if (vm.title && vm.title.trim().length > 0) {
      return vm.title;
    } else {
      return vm.name;
    }
  }

  _iconPath(name) {
    return Extension.dir.get_path() + "/media/" + name;
  }

  _vmIconPath(vm) {
    switch (vm.state) {
      case RUNNING:
        return this._iconPath("running.svg");
      case PAUSED:
        return this._iconPath("paused.svg");
      default:
        return this._iconPath("shut-off.svg");
    }
  }

  _vmIcon(vm) {
    const icon = new St.Icon({
      gicon: Gio.icon_new_for_string(this._vmIconPath(vm)),
      style_class: "system-status-icon",
      y_expand: false,
      y_align: Clutter.ActorAlign.CENTER
    });

    icon.set_size(20, 20);

    if (this._iconTheme === SETTINGS_ICON_THEME_BRIGHT) {
      const effect = new Clutter.BrightnessContrastEffect();
      effect.set_brightness(0.8);
      effect.set_contrast(0.2);
      icon.add_effect(effect);
    }

    return icon;
  }

  _runVirshCommand(subcommand, sync = false) {
    const command = `${this._virshCommand} ${subcommand}`;

    if (sync) {
      return GLib.spawn_command_line_sync(command);
    } else {
      return GLib.spawn_command_line_async(command);
    }
  }

  _runVirshVmCommand(subcommand, vm) {
    return this._runVirshCommand(`${subcommand} ${vm.name}`);
  }

  _runVirtManagerCommand(subcommand = "") {
    return GLib.spawn_command_line_async(`${this._virtManagerCommand} ${subcommand}`);
  }

  _loadVmList() {
    const [ok, out, _err, exit] = this._runVirshCommand("list --all --title", true);

    if (ok && exit === 0) {
      return Util.parseVirshTable(ByteArray.toString(out));
    } else {
      return null;
    }
  }

  _addVmVirshCommndSubMenuItem(vm, parentItem, name, command) {
    const item = new PopupMenu.PopupMenuItem(name);

    item.connect("activate", () => {
      log(`VM action ${name} ${vm.name}`);
      this._runVirshVmCommand(command, vm);
    });

    parentItem.menu.addMenuItem(item);
  }

  _addVmOpenVirtManagerSubMenuItem(vm, parentItem) {
    const openItem = new PopupMenu.PopupMenuItem("Open")
    openItem.connect("activate", () => {
      log(`Open VM editor ${vm.name}`);
      this._runVirtManagerCommand(`--show-domain-editor ${vm.name}`);
    });
    parentItem.menu.addMenuItem(openItem);
  }

  _addVmSubMenuItems(vm, parentItem) {
    if (this._virtManagerEnabled) {
      this._addVmOpenVirtManagerSubMenuItem(vm, parentItem);
    }

    if (vm.state === SHUT_OFF) {
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Start", "start");
    } else {
      if (vm.state === PAUSED) {
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Resume", "resume");
      } else {
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Pause", "suspend");
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Reboot", "reboot");
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Shutdown", "shutdown");
        this._addVmVirshCommndSubMenuItem(vm, parentItem, "Force Reset", "reset");
      }

      this._addVmVirshCommndSubMenuItem(vm, parentItem, "Force Off", "destroy");
    }
  }

  _addVmMenuItem(vm) {
    const item = new PopupMenu.PopupSubMenuMenuItem(this._vmMenuItemText(vm));
    this.menu.addMenuItem(item);

    if (this._iconTheme !== SETTINGS_ICON_THEME_NONE) {
      item.insert_child_at_index(this._vmIcon(vm), 1);
    }

    this._addVmSubMenuItems(vm, item);
  }

  _vmSort(vm1, vm2) {
    if (vm1.state === SHUT_OFF && vm2.state !== SHUT_OFF) {
      return 1;
    } else if (vm2.state === SHUT_OFF && vm1.state !== SHUT_OFF) {
      return -1;
    } else {
      return vm1.name.localeCompare(vm2.name);
    }
  }

  _addErrorMenuItem(message) {
    this.menu.addMenuItem(new PopupMenu.PopupMenuItem(message, { reactive: false }));
  }

  _addVirtManagerMenuItem() {
    const item = new PopupMenu.PopupMenuItem("Virtual Machine Manager");
    this.menu.addMenuItem(item);

    item.connect("activate", () => {
      log("Virtual Manage Manager opened");
      this._runVirtManagerCommand();
    });
  }

  _rebuildMenu() {
    this.menu.removeAll();

    if (this._virtManagerEnabled) {
      this._addVirtManagerMenuItem();
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    }

    if (this._vmLoadError) {
      this._addErrorMenuItem("Failed to load VM list.");
    } else {
      const vmList = Object.values(this._vms);

      if (vmList.length > 0) {
        vmList.sort(this._vmSort).forEach(vm => {
          this._addVmMenuItem(vm);
        });
      } else {
        this._addErrorMenuItem("No VMs found.");
      }
    }

    this._menuBuilt = true;
  }

  _normalizeVmData(vmData) {
    return {
      name: vmData.Name,
      title: vmData.Title,
      state: vmData.State
    };
  }

  _anyVmWithActivity() {
    return Object.values(this._vms).some(vm => vm.state !== SHUT_OFF);
  }

  _getIndicatorActivitytEffect() {
    if (!this._indicatorActivitytEffect) {
      const [ok, colorArray] = convertColor(this._activityHighlightColor);

      log(colorArray);

      if (ok) {
        const color = new Clutter.Color({
          red: colorArray[0],
          green: colorArray[1],
          blue: colorArray[2],
          alpha: 255
        });

        this._indicatorActivitytEffect = new Clutter.ColorizeEffect({ tint: color });
      }
    }

    return this._indicatorActivitytEffect;
  }

  _updateIndicatorIcon() {
    const effect = this._getIndicatorActivitytEffect();

    if (effect) {
      this.remove_effect(effect);

      if (this._anyVmWithActivity()) {
        this.add_effect(effect);
      }
    }
  }

  _handleNewVmList(vmListItems) {
    let rebuildRequired = !this._menuBuilt || vmListItems.length !== Object.keys(this._vms).length;

    const newVms = {};

    vmListItems.forEach(vmListItem => {
      const normalizedVm = this._normalizeVmData(vmListItem);
      const existingVm = this._vms[normalizedVm.name];

      if (!existingVm || (existingVm && !Util.objectsEqual(existingVm, normalizedVm))) {
        rebuildRequired = true;
      }

      newVms[normalizedVm.name] = normalizedVm;
    });

    this._vms = newVms;

    if (rebuildRequired) {
      this._rebuildMenu();
      this._updateIndicatorIcon();
    }
  }

  _refresh() {
    const vmListItems = this._loadVmList();

    if (vmListItems !== null) {
      this._vmLoadError = false;
      this._handleNewVmList(vmListItems);
    } else {
      this._vmLoadError = true;
      this._handleNewVmList([]);
    }

    Mainloop.timeout_add(1000, () => this._refresh());
  }

  _addIndicatorIcon() {
    const icon = new St.Icon({
      gicon: Gio.icon_new_for_string(this._iconPath("menu-icon.svg")),
      style_class: "system-status-icon",
    });

    const effect = new Clutter.BrightnessContrastEffect();
    effect.set_brightness(1);
    icon.add_effect(effect);

    this.add_child(icon);

    this._indicatorIcon = icon;
  }

  _getSettings() {
    const GioSSS = Gio.SettingsSchemaSource;

    const schemaSource = GioSSS.new_from_directory(
      Extension.dir.get_child("schemas").get_path(),
      GioSSS.get_default(),
      false
    );

    const schemaObj = schemaSource.lookup(SETTINGS_SCHEMA, true);

    if (!schemaObj) {
      throw new Error("Cannot find schemas");
    }

    return new Gio.Settings({ settings_schema: schemaObj });
  }

  _init() {
    super._init(0);

    const settings = this._getSettings();
    this._virtManagerEnabled = settings.get_boolean(SETTINGS_VIRT_MANAGER_ENABLED);
    this._virtManagerCommand = settings.get_string(SETTINGS_VIRT_MANAGER_COMMAND);
    this._virshCommand = settings.get_string(SETTINGS_VIRSH_COMMAND);
    this._iconTheme = settings.get_enum(SETTINGS_ICON_THEME);
    this._activityHighlightColor = settings.get_string(SETTINGS_ACTIVITY_HIGHLIGHT_COLOR);

    this._vms = {};

    this._addIndicatorIcon();
    this._refresh();
  }

}

var LibvirtMenu = GObject.registerClass(LibvirtMenuClass);
