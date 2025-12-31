import {
  generateVideoId,
  getVideoPath,
  createVideoMetadata,
} from '@/lib/videoStorage';

describe('videoStorage', () => {
  describe('generateVideoId', () => {
    it('should generate unique video IDs', () => {
      const id1 = generateVideoId();
      const id2 = generateVideoId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^vid_\d+_[a-z0-9]+$/);
    });

    it('should generate IDs with correct format', () => {
      const id = generateVideoId();
      expect(id).toContain('vid_');
      expect(id.split('_')).toHaveLength(3);
    });
  });

  describe('getVideoPath', () => {
    it('should return correct path for video ID', () => {
      const path = getVideoPath('test-id');
      expect(path).toContain('videos/test-id.mp4');
    });

    it('should include .mp4 extension', () => {
      const path = getVideoPath('my-video');
      expect(path).toMatch(/\.mp4$/);
    });
  });

  describe('createVideoMetadata', () => {
    it('should create video metadata with highlights', () => {
      const metadata = createVideoMetadata(
        'test-id',
        'file://test.mp4',
        120,
        [{ timestamp: 30 }, { timestamp: 60 }]
      );

      expect(metadata.id).toBe('test-id');
      expect(metadata.uri).toBe('file://test.mp4');
      expect(metadata.duration).toBe(120);
      expect(metadata.highlights).toHaveLength(2);
      expect(metadata.highlights[0].timestamp).toBe(30);
      expect(metadata.highlights[1].timestamp).toBe(60);
    });

    it('should create metadata without highlights', () => {
      const metadata = createVideoMetadata(
        'test-id',
        'file://test.mp4',
        60,
        []
      );

      expect(metadata.highlights).toHaveLength(0);
    });

    it('should set createdAt to current date', () => {
      const before = new Date();
      const metadata = createVideoMetadata('test-id', 'file://test.mp4', 60, []);
      const after = new Date();

      expect(metadata.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metadata.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
