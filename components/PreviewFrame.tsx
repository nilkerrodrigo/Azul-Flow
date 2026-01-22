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
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) {
        doc.body.contentEditable = enable ? 'true' : 'false';
        
        // Injeta estilos visuais e scripts de interação
        if (enable) {
            const style = doc.createElement('style');
            style.id = 'editor-styles';
            style.innerHTML = `
                *[contenteditable="true"]:hover { outline: 2px dashed #0ea5e9; cursor: pointer; }
                *[contenteditable="true"]:focus { outline: 2px solid #0ea5e9; background-color: rgba(14, 165, 233, 0.05); }
                img:hover { outline: 3px solid #f59e0b; cursor: alias; }
            `;
            doc.head.appendChild(style);

            // Adiciona Script de Interatividade para Edição
            const script = doc.createElement('script');
            script.id = 'editor-interactions';
            script.textContent = `
                document.body.addEventListener('dblclick', function(e) {
                    if (document.body.contentEditable !== 'true') return;
                    e.preventDefault();
                    e.stopPropagation();

                    const target = e.target;

                    // 1. Edição de Imagem
                    if (target.tagName === 'IMG') {
                        const currentSrc = target.src;
                        const newSrc = prompt('🖼️ Alterar Imagem\\n\\nCole o link (URL) da nova imagem:', currentSrc);
                        if (newSrc && newSrc.trim() !== '') {
                            target.src = newSrc;
                        }
                        return;
                    }

                    // 2. Edição de Cor de Fundo (Alt + Click) ou se o elemento for um bloco vazio
                    if (e.altKey || (!target.textContent.trim() && target.tagName === 'DIV')) {
                         const currentColor = window.getComputedStyle(target).backgroundColor;
                         const newColor = prompt('🎨 Alterar Cor de Fundo\\n\\nDigite a cor (ex: #ff0000, blue, rgb(0,0,0)):', currentColor);
                         if (newColor) {
                             target.style.backgroundColor = newColor;
                         }
                         return;
                    }

                    // 3. Edição de Cor de Texto
                    // Se não for imagem e não tiver Alt pressionado, assume que quer editar texto/estilo
                    const currentColor = window.getComputedStyle(target).color;
                    const newColor = prompt('✏️ Alterar Cor do Texto\\n\\nDigite a cor do texto:', currentColor);
                    if (newColor) {
                        target.style.color = newColor;
                    }
                });
            `;
            doc.body.appendChild(script);

        } else {
            const style = doc.getElementById('editor-styles');
            if (style) style.remove();
            
            const script = doc.getElementById('editor-interactions');
            if (script) script.remove();
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
  }, [html]);

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