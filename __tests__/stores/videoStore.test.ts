import { useVideoStore } from '@/stores/videoStore';
import { mockVideo, mockHighlight } from '../../test-utils/mocks';

describe('videoStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useVideoStore.setState({
      videos: [],
      currentRecording: {
        isRecording: false,
        startTime: null,
        highlights: [],
      },
    });
  });

  describe('video management', () => {
    it('should add video to store', () => {
      const store = useVideoStore.getState();
      store.addVideo(mockVideo);

      const state = useVideoStore.getState();
      expect(state.videos).toHaveLength(1);
      expect(state.videos[0].id).toBe(mockVideo.id);
    });

    it('should add multiple videos', () => {
      const store = useVideoStore.getState();
      const video2 = { ...mockVideo, id: 'test-video-2' };

      store.addVideo(mockVideo);
      store.addVideo(video2);

      const state = useVideoStore.getState();
      expect(state.videos).toHaveLength(2);
    });

    it('should remove video from store', () => {
      const store = useVideoStore.getState();
      store.addVideo(mockVideo);
      store.removeVideo(mockVideo.id);

      const state = useVideoStore.getState();
      expect(state.videos).toHaveLength(0);
    });

    it('should not fail when removing non-existent video', () => {
      const store = useVideoStore.getState();
      expect(() => store.removeVideo('non-existent')).not.toThrow();
    });
  });

  describe('recording state', () => {
    it('should start recording', () => {
      const store = useVideoStore.getState();
      store.startRecording();

      const state = useVideoStore.getState();
      expect(state.currentRecording.isRecording).toBe(true);
      expect(state.currentRecording.startTime).toBeTruthy();
      expect(state.currentRecording.highlights).toHaveLength(0);
    });

    it('should stop recording', () => {
      const store = useVideoStore.getState();
      store.startRecording();
      store.stopRecording();

      const state = useVideoStore.getState();
      expect(state.currentRecording.isRecording).toBe(false);
      expect(state.currentRecording.startTime).toBeTruthy(); // startTime persists
    });

    it('should reset recording', () => {
      const store = useVideoStore.getState();
      store.startRecording();
      store.tagHighlight();
      store.resetRecording();

      const state = useVideoStore.getState();
      expect(state.currentRecording.isRecording).toBe(false);
      expect(state.currentRecording.startTime).toBeNull();
      expect(state.currentRecording.highlights).toHaveLength(0);
    });
  });

  describe('highlight tagging', () => {
    it('should tag highlights during recording', () => {
      const store = useVideoStore.getState();
      store.startRecording();

      // Wait a bit before tagging
      jest.advanceTimersByTime(1000);
      store.tagHighlight();

      jest.advanceTimersByTime(1000);
      store.tagHighlight();

      const state = useVideoStore.getState();
      expect(state.currentRecording.highlights).toHaveLength(2);
    });

    it('should not tag highlight when not recording', () => {
      const store = useVideoStore.getState();
      store.tagHighlight();

      const state = useVideoStore.getState();
      expect(state.currentRecording.highlights).toHaveLength(0);
    });

    it('should calculate timestamp from start time', () => {
      const store = useVideoStore.getState();
      const startTime = Date.now();

      // Mock Date.now to return predictable values
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime) // startRecording
        .mockReturnValueOnce(startTime + 5000); // tagHighlight

      store.startRecording();
      store.tagHighlight();

      const state = useVideoStore.getState();
      expect(state.currentRecording.highlights[0].timestamp).toBeCloseTo(5, 0);
    });
  });

  describe('highlight management', () => {
    it('should add highlight to video', () => {
      const store = useVideoStore.getState();
      store.addVideo(mockVideo);
      store.addHighlight(mockVideo.id, mockHighlight);

      const state = useVideoStore.getState();
      expect(state.videos[0].highlights).toHaveLength(1);
      expect(state.videos[0].highlights[0].id).toBe(mockHighlight.id);
    });

    it('should remove highlight from video', () => {
      const store = useVideoStore.getState();
      const videoWithHighlight = { ...mockVideo, highlights: [mockHighlight] };
      store.addVideo(videoWithHighlight);
      store.removeHighlight(mockVideo.id, mockHighlight.id);

      const state = useVideoStore.getState();
      expect(state.videos[0].highlights).toHaveLength(0);
    });
  });
});
