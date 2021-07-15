# Libvirt Menu Extension for Gnome

A Gnome Shell extension providing a basic menu to manage VMs running via Libvirt.

![screenshot](https://github.com/nickewing/gnome-libvirt-menu-extension/blob/main/media/screenshot.png)

## Requirements

In order for this extension to work, the `virsh` command must be available without the need of a password.  See the
following to run specific commands without a password using sudo:
  https://ostechnix.com/run-particular-commands-without-sudo-password-linux/

## Manual installation

Run the following commands:

  ```
  git clone https://github.com/nickewing/gnome-libvirt-menu-extension
  cd gnome-libvirt-menu-extension
  ./release.sh
  gnome-extensions install libvirt-menu@extensions.gnome.nickewing.net.zip
  ```

Log out and back in, or restart Gnome Shell (Alt + F2, then enter "r" in the prompt).

  ```
  gnome-extensions enable libvirt-menu@extensions.gnome.nickewing.net
  ```

## Troubleshooting

### VM List fails to load

Check that the following command successfully returns your list of libvirt VMs, without
needing to enter a password:

  ```
  sudo virsh list --all
  ```

You may need to update your virsh-command setting as described in Settings or enable password-free sudo as described in
Requirements.  Also note that the list of VMs may be different depending on if `virsh` is ran as root i.e. with `sudo`
or not.

### Virtual Machine Manager or "Open" menu items do not work

Check that the following command successfully opens virtual machine manager without an errors:

  ```
  virt-manager --connect qemu:///system
  ```

### Virtual Machine Manager requires a password when opening

Though not actually related to the functionality of this extension, this can be annoying.  See:
https://computingforgeeks.com/use-virt-manager-as-non-root-user/

## Settings

Currently this extension's settings can only be set via the terminal using `gsettings`, like so:

  ```
  gsettings --schemadir ~/.local/share/gnome-shell/extensions/libvirt-menu@extensions.gnome.nickewing.net/schemas \
    set org.gnome.shell.extensions.libvirt-menu icon-theme "dark"
  ```

Note that in this command, `icon-theme` is the name of a setting listed below and `"dark"` is the value for that setting.

After updating a setting, you must restart gnome-shell for the setting to take effect.

### `icon-theme`

Sets whether icons shown in menu are light, dark, or disabled.

Default value: `"bright"`

Available values: `"none"`, `"bright"`, `"dark"`

### `activity-highlight-color`

Sets the highlight color of the main icon when any VM is running.  Set to `""` to disable.

Default value: `"#009900"`

### `virsh-command`

Sets the base command used by the extension to interface with libvirt.  Note that additional command arguments will be
appended to this value.

Default value: `"sudo virsh"`

### `virt-manager-command`

Sets the base command used by the extension to interface with Virtual Machine Manager.  Note that additional command
arguments will be appended to this value.

Default value: `"virt-manager --connect qemu:///system"`

### `virt-manager-enabled`

Enables or disables Virtual Machine Manager menu options

Default value: `true`

Available values: `true`, `false`

## Credits

Menu icons provided by https://remixicon.com/
