import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { EmptyState } from './empty-state';

export function IndexPage() {
  const { fileTree, addNode, activeSpaceId } = useFileSystem();
  const navigate = useNavigate();

  const handleCreateFile = async () => {
    const newId = await addNode(null);
    if (!activeSpaceId) {
      return;
    }
    navigate({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: activeSpaceId, fileId: newId },
    });
  };

  const hasFiles = fileTree.length > 0;

  return (
    <div className="flex w-full min-h-[calc(100svh-5.75rem)] items-end justify-start pl-6 pb-16 text-muted-foreground">
      {hasFiles ? null : (
        <EmptyState onCreateFile={handleCreateFile} />
      )}
    </div>
  );
}
