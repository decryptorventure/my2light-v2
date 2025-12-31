# Manual Testing Checklist

## Authentication
- [ ] Login with Apple works
- [ ] Login with Google works
- [ ] Email/password login works
- [ ] Session persists after app restart
- [ ] Sign out clears session and redirects to login

## Recording
- [ ] Camera permissions requested correctly
- [ ] Camera preview displays
- [ ] Recording starts and stops
- [ ] Highlight tagging works during recording
- [ ] Timer displays correctly
- [ ] Video saves to local storage
- [ ] Flip camera works

## Video Editing
- [ ] Video loads in editor
- [ ] Playback controls work (play/pause/seek)
- [ ] Timeline trim handles respond to gestures
- [ ] Speed control changes playback speed
- [ ] Music overlay adds background audio
- [ ] Export processes video correctly
- [ ] Progress indicator shows during processing

## Reel Creation
- [ ] Clip selection from gallery works
- [ ] Drag-to-reorder clips functions
- [ ] Concatenation produces valid output
- [ ] Preview plays concatenated reel
- [ ] Share menu opens
- [ ] Save to camera roll works

## Gallery
- [ ] Videos display in grid
- [ ] Thumbnails load correctly
- [ ] Pull-to-refresh updates list
- [ ] Video preview modal opens
- [ ] Delete removes video and thumbnail
- [ ] Empty state displays when no videos

## Performance
- [ ] App launches in < 3 seconds
- [ ] Gallery scrolling is smooth (60fps)
- [ ] Camera preview has no lag
- [ ] Recording doesn't drop frames
- [ ] Video playback is smooth
- [ ] No memory leaks (test with multiple videos)

## Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Permission denials handled gracefully
- [ ] FFmpeg failures don't crash app
- [ ] Invalid video files handled
- [ ] Error boundary catches React errors

## Device Testing
- [ ] iPhone 12 Pro (iOS 16)
- [ ] iPhone 14 (iOS 17)
- [ ] Pixel 6 (Android 13)
- [ ] Samsung Galaxy S22 (Android 14)
