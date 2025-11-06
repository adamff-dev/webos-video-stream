# Remote Video Player

A webOS application that allows you to browse and stream video files from a remote server on your LG Smart TV.

Based on [youtube-webos](https://github.com/webosbrew/youtube-webos)

## Features

- **Server File Browser**: Browse files and directories on your media server through an intuitive interface
- **Video Streaming**: Stream MP4, WebM, and OGG video files directly to your TV
- **Resume Playback**: Automatically saves and restores playback position for each video based on file duration
- **Remote Control Navigation**: Full support for webOS TV remote control navigation
  - Use directional keys to navigate through files and interface elements
  - Press Enter/OK to select files or play/pause videos
  - Use Back button to return to file browser from video playback
- **Fullscreen Video Playback**: Automatic toolbar hiding during video playback for immersive viewing
- **URL Management**: Save and manage your media server URL for quick access
- **Cross-Frame Navigation**: Seamless navigation between the file browser and video player interfaces
- **Responsive Design**: Optimized interface for TV screens with large, easy-to-read controls

## Supported Video Formats

The application supports the following video formats that are natively supported by webOS:
- **MP4** (.mp4) - H.264/H.265 codecs
- **WebM** (.webm) - VP8/VP9 codecs  
- **OGG** (.ogg) - Theora codec

## Server Requirements

Your media server should:
- Serve files over HTTP/HTTPS
- Provide directory listings (file browser functionality)
- Allow direct access to video files
- Support CORS if running on a different domain

Compatible servers include:
- **SHTTPS** - Android app for creating HTTP server ([Google Play Store](https://play.google.com/store/apps/details?id=com.phlox.simpleserver))
- **HTTP File Server (HFS)** - Windows GUI application for file sharing ([rejetto.com](https://www.rejetto.com/hfs/))
- Python's built-in HTTP server (`python -m http.server`)
- Node.js http-server (`npx http-server`)
- Apache HTTP Server
- Nginx
- Any web server with directory listing enabled

## Contribution

We welcome contributions of any kind — code, documentation, bug reports, or feature suggestions.

If you find this project helpful and want to support its development, consider making a donation.

Your support helps keep the project active and maintained. Thank you! 🙌

## Usage

1. **Set Server URL**: Enter your media server URL (e.g., `http://192.168.1.100:8080/`) in the input field
2. **Save Configuration**: Click "Guardar" (Save) button to save your server URL
3. **Browse Files**: Navigate through your server's directory structure using the remote control
4. **Play Videos**: Click on any supported video file (.mp4, .webm, .ogg) to start streaming
5. **Control Playback**: Use the remote control to play/pause, seek, and navigate back to file browser
6. **Resume Feature**: The app automatically remembers where you left off in each video

### Remote Control Navigation

- **Directional Keys**: Navigate through files and interface elements
- **Enter/OK**: Select files, play/pause video, or activate buttons
- **Back**: Return from video player to file browser
- **Up/Down in Video**: Show/hide toolbar during playback

## Installation

- Use [Device Manager app](https://github.com/webosbrew/dev-manager-desktop) - see [Releases](https://github.com/adamff-dev/webos-video-stream/releases) for a
  prebuilt `.ipk` binary file
- Use [webOS TV CLI tools](https://webostv.developer.lge.com/develop/tools/cli-installation) -
  `ares-install rvp.adamffdev.v1_*.ipk` (for webOS CLI tools configuration see below)

## Configuration

The application stores your server URL and video playback positions locally. No additional configuration is required.

## Building

- Clone the repository

```sh
git clone https://github.com/adamff-dev/webos-video-stream.git
```

- Enter the folder and build the App, this will generate a `*.ipk` file.

```sh
cd webos-video-stream

# Install dependencies (need to do this only when updating local repository / package.json is changed)
npm install

npm run build && npm run package
```

## Development TV setup

### Configuring webOS TV CLI tools with Developer Mode App

This is partially based on: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app

- Install Developer Mode app from Content Store
- Enable developer mode, enable keyserver
- Download TV's private key: `http://TV_IP:9991/webos_rsa`
- Configure the device using `ares-setup-device` (`-a` may need to be replaced with `-m` if device named `webos` is already configured)
  - `PASSPHRASE` is the 6-character passphrase printed on screen in developer mode app

```sh
ares-setup-device -a webos -i "username=prisoner" -i "privatekey=/path/to/downloaded/webos_rsa" -i "passphrase=PASSPHRASE" -i "host=TV_IP" -i "port=9922"
```

- Modify device info:

```sh
ares-setup-device --modify emulator --info "host=TV_IP"
```

### Configuring webOS TV CLI tools with Homebrew Channel / root

- Enable sshd in Homebrew Channel app
- Generate ssh key on developer machine (`ssh-keygen`)
- Copy the public key (`id_rsa.pub`) to `/home/root/.ssh/authorized_keys` on TV
- Configure the device using `ares-setup-device` (`-a` may need to be replaced with `-m` if device named `webos` is already configured)

```sh
ares-setup-device -a webos -i "username=root" -i "privatekey=/path/to/id_rsa" -i "passphrase=SSH_KEY_PASSPHRASE" -i "host=TV_IP" -i "port=22"
```

## Deployment

```
npm run deploy
```

## Launching

- The app will be available in the TV's app list or launch it using ares-cli.

```sh
npm run launch
```

## Build, deploy and launch

The following one-liner is convenient for debugging because it chains together all the essential steps — building, packaging, deploying, and launching — into a single command:

```sh
pnpm run build && pnpm run package && pnpm run deploy && pnpm run launch
```
