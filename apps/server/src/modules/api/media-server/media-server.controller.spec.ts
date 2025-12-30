import {
  EMediaDataType,
  EMediaServerType,
  MediaCollection,
  MediaItem,
  MediaLibrary,
  MediaServerStatus,
  MediaUser,
  PagedResult,
  WatchRecord,
} from '@maintainerr/contracts';
import { MediaServerController } from './media-server.controller';
import { MediaServerFactory } from './media-server.factory';
import { MediaServerSetupGuard } from './guards/media-server-setup.guard';
import { IMediaServerService } from './media-server.interface';

describe('MediaServerController', () => {
  let controller: MediaServerController;
  let mockMediaServerFactory: jest.Mocked<MediaServerFactory>;
  let mockMediaServerService: jest.Mocked<IMediaServerService>;

  // Mock data for testing
  const mockLibraries: MediaLibrary[] = [
    { id: '1', title: 'Movies', type: 'movie' },
    { id: '2', title: 'TV Shows', type: 'show' },
  ];

  const mockUsers: MediaUser[] = [
    { id: 'user1', name: 'User One' },
    { id: 'user2', name: 'User Two' },
  ];

  const mockStatus: MediaServerStatus = {
    machineId: 'server123',
    version: '1.0.0',
    name: 'Test Server',
    platform: 'Linux',
  };

  const mockMediaItem: MediaItem = {
    id: 'item1',
    title: 'Test Movie',
    type: EMediaDataType.MOVIES,
    year: 2023,
    addedAt: new Date(),
    guid: 'plex://movie/12345',
    providerIds: { tmdb: '12345' },
    mediaSources: [],
    library: { id: '1', title: 'Movies' },
  };

  const mockCollection: MediaCollection = {
    id: 'coll1',
    title: 'Test Collection',
    summary: 'A test collection',
    childCount: 5,
  };

  const mockWatchRecords: WatchRecord[] = [
    { userId: 'user1', itemId: 'item1', watchedAt: new Date(), progress: 100 },
  ];

  beforeEach(async () => {
    // Create mock media server service
    mockMediaServerService = {
      initialize: jest.fn(),
      uninitialize: jest.fn(),
      isSetup: jest.fn().mockReturnValue(true),
      getServerType: jest.fn().mockReturnValue(EMediaServerType.PLEX),
      supportsFeature: jest.fn().mockReturnValue(true),
      getStatus: jest.fn().mockResolvedValue(mockStatus),
      getUsers: jest.fn().mockResolvedValue(mockUsers),
      getUser: jest.fn().mockResolvedValue(mockUsers[0]),
      getLibraries: jest.fn().mockResolvedValue(mockLibraries),
      getLibraryContents: jest.fn().mockResolvedValue({
        items: [mockMediaItem],
        totalSize: 1,
        offset: 0,
        limit: 50,
      } as PagedResult<MediaItem>),
      getLibraryContentCount: jest.fn().mockResolvedValue(100),
      searchLibraryContents: jest.fn().mockResolvedValue([mockMediaItem]),
      getMetadata: jest.fn().mockResolvedValue(mockMediaItem),
      getChildrenMetadata: jest.fn().mockResolvedValue([mockMediaItem]),
      getRecentlyAdded: jest.fn().mockResolvedValue([mockMediaItem]),
      searchContent: jest.fn().mockResolvedValue([mockMediaItem]),
      getWatchHistory: jest.fn().mockResolvedValue(mockWatchRecords),
      getItemSeenBy: jest.fn().mockResolvedValue(['user1']),
      getCollections: jest.fn().mockResolvedValue([mockCollection]),
      getCollection: jest.fn().mockResolvedValue(mockCollection),
      createCollection: jest.fn().mockResolvedValue(mockCollection),
      deleteCollection: jest.fn().mockResolvedValue(undefined),
      getCollectionChildren: jest.fn().mockResolvedValue([mockMediaItem]),
      addToCollection: jest.fn().mockResolvedValue(undefined),
      removeFromCollection: jest.fn().mockResolvedValue(undefined),
      getPlaylists: jest.fn().mockResolvedValue([]),
      deleteFromDisk: jest.fn().mockResolvedValue(undefined),
      resetMetadataCache: jest.fn(),
    } as unknown as jest.Mocked<IMediaServerService>;

    // Create mock factory
    mockMediaServerFactory = {
      getService: jest.fn().mockResolvedValue(mockMediaServerService),
    } as unknown as jest.Mocked<MediaServerFactory>;

    // Instantiate controller directly with mock
    controller = new MediaServerController(mockMediaServerFactory);
  });

  describe('Server Info', () => {
    it('should return server status', async () => {
      const result = await controller.getStatus();

      expect(mockMediaServerFactory.getService).toHaveBeenCalled();
      expect(mockMediaServerService.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });

    it('should return server type', async () => {
      const result = await controller.getServerType();

      expect(result).toEqual({ type: EMediaServerType.PLEX });
    });
  });

  describe('Libraries', () => {
    it('should return all libraries', async () => {
      const result = await controller.getLibraries();

      expect(mockMediaServerService.getLibraries).toHaveBeenCalled();
      expect(result).toEqual(mockLibraries);
    });

    it('should return library content with default pagination', async () => {
      const result = await controller.getLibraryContent('1');

      expect(mockMediaServerService.getLibraryContents).toHaveBeenCalledWith('1', {
        offset: 0,
        limit: 50,
        type: undefined,
      });
      expect(result.items).toHaveLength(1);
    });

    it('should return library content with custom pagination', async () => {
      const result = await controller.getLibraryContent('1', 2, 25);

      expect(mockMediaServerService.getLibraryContents).toHaveBeenCalledWith('1', {
        offset: 25, // (page 2 - 1) * 25
        limit: 25,
        type: undefined,
      });
    });

    it('should return library content with type filter', async () => {
      await controller.getLibraryContent('1', 1, 50, EMediaDataType.MOVIES);

      expect(mockMediaServerService.getLibraryContents).toHaveBeenCalledWith('1', {
        offset: 0,
        limit: 50,
        type: EMediaDataType.MOVIES,
      });
    });

    it('should search library content', async () => {
      const result = await controller.searchLibraryContent('1', 'test');

      expect(mockMediaServerService.searchLibraryContents).toHaveBeenCalledWith(
        '1',
        'test',
        undefined,
      );
      expect(result).toEqual([mockMediaItem]);
    });

    it('should return recently added items', async () => {
      const result = await controller.getRecentlyAdded('1', 10);

      expect(mockMediaServerService.getRecentlyAdded).toHaveBeenCalledWith('1', { limit: 10 });
      expect(result).toEqual([mockMediaItem]);
    });
  });

  describe('Users', () => {
    it('should return all users', async () => {
      const result = await controller.getUsers();

      expect(mockMediaServerService.getUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return a single user by id', async () => {
      const result = await controller.getUser('user1');

      expect(mockMediaServerService.getUser).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockUsers[0]);
    });
  });

  describe('Metadata', () => {
    it('should return metadata for an item', async () => {
      const result = await controller.getMetadata('item1');

      expect(mockMediaServerService.getMetadata).toHaveBeenCalledWith('item1');
      expect(result).toEqual(mockMediaItem);
    });

    it('should return children metadata', async () => {
      const result = await controller.getChildrenMetadata('item1');

      expect(mockMediaServerService.getChildrenMetadata).toHaveBeenCalledWith('item1');
      expect(result).toEqual([mockMediaItem]);
    });

    it('should return watch history', async () => {
      const result = await controller.getWatchHistory('item1');

      expect(mockMediaServerService.getWatchHistory).toHaveBeenCalledWith('item1');
      expect(result).toEqual(mockWatchRecords);
    });
  });

  describe('Search', () => {
    it('should search content across the media server', async () => {
      const result = await controller.searchContent('test query');

      expect(mockMediaServerService.searchContent).toHaveBeenCalledWith('test query');
      expect(result).toEqual([mockMediaItem]);
    });
  });

  describe('Collections', () => {
    it('should return collections for a library', async () => {
      const result = await controller.getCollections('1');

      expect(mockMediaServerService.getCollections).toHaveBeenCalledWith('1');
      expect(result).toEqual([mockCollection]);
    });

    it('should return a single collection', async () => {
      const result = await controller.getCollection('coll1');

      expect(mockMediaServerService.getCollection).toHaveBeenCalledWith('coll1');
      expect(result).toEqual(mockCollection);
    });

    it('should return collection children', async () => {
      const result = await controller.getCollectionChildren('coll1');

      expect(mockMediaServerService.getCollectionChildren).toHaveBeenCalledWith('coll1');
      expect(result).toEqual([mockMediaItem]);
    });

    it('should create a collection', async () => {
      const params = {
        libraryId: '1',
        title: 'New Collection',
        type: EMediaDataType.MOVIES,
      };
      const result = await controller.createCollection(params);

      expect(mockMediaServerService.createCollection).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockCollection);
    });

    it('should delete a collection', async () => {
      await controller.deleteCollection('coll1');

      expect(mockMediaServerService.deleteCollection).toHaveBeenCalledWith('coll1');
    });

    it('should add an item to a collection', async () => {
      await controller.addToCollection('coll1', 'item1');

      expect(mockMediaServerService.addToCollection).toHaveBeenCalledWith('coll1', 'item1');
    });

    it('should remove an item from a collection', async () => {
      await controller.removeFromCollection('coll1', 'item1');

      expect(mockMediaServerService.removeFromCollection).toHaveBeenCalledWith('coll1', 'item1');
    });
  });

  describe('Guard Integration', () => {
    it('should use MediaServerSetupGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MediaServerController);
      expect(guards).toBeDefined();
      expect(guards).toContain(MediaServerSetupGuard);
    });
  });
});
