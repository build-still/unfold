import { useParams } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import TitleEditor from "./title-editor";
import PageEditor from "./page-editor";
import { EditorSkeleton } from "./editor-skeleton";

function FullPageEditor() {
  const { fileId } = useParams({ from: "/spaces/$spaceId/files/$fileId" });
  const { getNode } = useFileSystem();

  const file = fileId ? getNode(fileId) : null;
  if (fileId && !file) {
    return <EditorSkeleton />;
  }
  if (!fileId) {
    return null;
  }

  return (
    <div className="relative w-full">
      <TitleEditor key={`title-${fileId}`} fileId={fileId} />
      <PageEditor key={`page-${fileId}`} fileId={fileId} />
    </div>
  );
}

export default FullPageEditor;
