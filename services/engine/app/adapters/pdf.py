import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)


class PDFCompilerService:
    """
    Compilateur de PDF vectoriel ATS 1 page via Playwright (AD-7).
    Garantit un document vectoriel A4 avec texte sélectionnable natif.
    """

    @classmethod
    async def compile_html_to_pdf(cls, html_content: str) -> bytes:
        """
        Rend le HTML en mémoire et compile un PDF vectoriel A4 calibré pour 1 page.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.set_content(html_content, wait_until="load")
                
                pdf_bytes = await page.pdf(
                    format="A4",
                    print_background=True,
                    prefer_css_page_size=True,
                    margin={"top": "8mm", "bottom": "8mm", "left": "10mm", "right": "10mm"},
                )
                return pdf_bytes
            except Exception as e:
                logger.error(f"Erreur lors de la compilation PDF Playwright : {e}")
                raise RuntimeError(f"Échec de la compilation PDF vectorielle : {e}") from e
            finally:
                await browser.close()
