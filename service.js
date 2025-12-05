import TrackPlayer from 'react-native-track-player';

export default async function playbackService() {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
  TrackPlayer.addEventListener('remote-next', () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener('remote-previous', () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy());
  TrackPlayer.addEventListener('remote-seek', ({ position }) => TrackPlayer.seekTo(position));
  
  TrackPlayer.addEventListener('playback-track-changed', async (event) => {
    console.log('Track changed:', event);
  });
}