import './App.css';

import { RouterProvider } from '@tanstack/react-router';

import { GlobalSelectionHighlighter } from '@/components/common/global-selection-highlighter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { EditorProvider } from '@/contexts/EditorContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/router';
import { store } from '@/store';

function App() {
  return (
    <ThemeProvider>
      <GlobalSelectionHighlighter />
      <EditorProvider>
        <SidebarProvider defaultOpen={true}>
          <RouterProvider router={router} context={{ store }} />
        </SidebarProvider>
      </EditorProvider>
    </ThemeProvider>
  );
}

export default App;
