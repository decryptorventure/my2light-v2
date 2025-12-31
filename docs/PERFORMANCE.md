# Performance Benchmarks

## Metrics to Track

### App Launch
- **Target:** < 3 seconds to interactive
- **Measurement:** Time from tap to gallery visible

### Recording
- **Target:** 60fps camera preview
- **Measurement:** Use React DevTools Profiler
- **Max memory:** < 200MB during recording

### Video Processing
- **Trim 1-min video:** < 5 seconds
- **Speed change 1-min video:** < 15 seconds
- **Concat 3x 30-sec videos:** < 10 seconds

### Gallery
- **Scroll performance:** 60fps
- **Thumbnail load:** < 500ms per thumbnail
- **Memory per video:** < 5MB

## Optimization Tips
1. Use FlatList with `getItemLayout` for known heights
2. Memoize VideoCard components
3. Lazy load thumbnails
4. Use FFmpeg `-c copy` when possible
5. Implement video pagination for 50+ videos

## Current Performance (v1.0.0)
- **App Launch:** TBD
- **Gallery Scroll:** TBD
- **Video Processing:** TBD
- **Memory Usage:** TBD

## Performance Testing Commands
```bash
# React Native performance monitor
npx react-native start --reset-cache

# Memory profiling
npx react-native run-ios --configuration Release
# Open Xcode > Debug > Memory Graph

# FPS monitoring
# Enable "Show Perf Monitor" in dev menu
```
