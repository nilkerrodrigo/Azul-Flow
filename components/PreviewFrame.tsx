import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface PreviewFrameProps {
  html: string | null;
  isEditing?: boolean;
}

export interface PreviewFrameHandle {
  getHtml: () => string | undefined;
  enableEditMode: (enable: boolean) => void;
}

const PreviewFrame = forwardRef<PreviewFrameHandle, PreviewFrameProps>(({ html, isEditing }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Expõe métodos para o componente pai
  useImperativeHandle(ref, () => ({
    getHtml: () => {
      if (iframeRef.current?.contentDocument) {
        return iframeRef.current.contentDocument.documentElement.outerHTML;
      }
      return undefined;
    },
    enableEditMode: (enable: boolean) => {
      if (iframeRef.current?.contentDocument?.body) {
        iframeRef.current.contentDocument.body.contentEditable = enable ? 'true' : 'false';
        // Injeta um estilo visual para indicar modo de edição
        if (enable) {
            const style = iframeRef.current.contentDocument.createElement('style');
            style.id = 'editor-styles';
            style.innerHTML = `
                *[contenteditable="true"]:hover { outline: 2px dashed #0ea5e9; cursor: text; }
                *[contenteditable="true"]:focus { outline: 2px solid #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
            `;
            iframeRef.current.contentDocument.head.appendChild(style);
        } else {
            const style = iframeRef.current.contentDocument.getElementById('editor-styles');
            if (style) style.remove();
        }
      }
    }
  }));

  // Atualiza o conteúdo apenas se o HTML mudar externamente (não durante edição manual)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && html && !isEditing) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    } else if (iframe && !html) {
        // Empty state
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if(doc) {
            doc.open();
            doc.write(`
                <html>
                    <body style="background-color: #0f172a; color: #64748b; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                        <div style="text-align: center;">
                            <h2 style="margin-bottom: 8px;">Aguardando geração...</h2>
                            <p style="font-size: 14px;">Seu preview aparecerá aqui.</p>
                        </div>
                    </body>
                </html>
            `);
            doc.close();
        }
    }
  }, [html]); // isEditing removido das dependências para evitar re-render ao alternar modo

  return (
    <iframe
      ref={iframeRef}
      title="Live Preview"
      className="w-full h-full bg-white rounded-lg shadow-inner"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals" 
    />
  );
});

export default PreviewFrame;