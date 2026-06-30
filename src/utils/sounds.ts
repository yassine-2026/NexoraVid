import { Howl } from 'howler';

// Using some open source sound effects from a CDN or base64
// We'll use short data URIs or public domain sound URLs to ensure it works without external assets
const clickSoundUrl = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const successSoundUrl = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
const completeSoundUrl = 'https://assets.mixkit.co/active_storage/sfx/1081/1081-preview.mp3';

let isMuted = false;

export const sounds = {
  click: new Howl({ src: [clickSoundUrl], volume: 0.5 }),
  success: new Howl({ src: [successSoundUrl], volume: 0.6 }),
  complete: new Howl({ src: [completeSoundUrl], volume: 0.7 }),
};

export const playSound = (soundName: keyof typeof sounds) => {
  if (isMuted) return;
  sounds[soundName].play();
};

export const toggleMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const getIsMuted = () => isMuted;
