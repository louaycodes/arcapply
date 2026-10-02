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
                
                pdf_options = {
                    "format": "A4",
                    "print_background": True,
                    "prefer_css_page_size": True,
                }
                if "@page" not in html_content:
                    pdf_options["margin"] = {"top": "8mm", "bottom": "8mm", "left": "12mm", "right": "12mm"}

                pdf_bytes = await page.pdf(**pdf_options)
                return pdf_bytes
            except Exception as e:
                logger.error(f"Erreur lors de la compilation PDF Playwright : {e}")
                raise RuntimeError(f"Échec de la compilation PDF vectorielle : {e}") from e
            finally:
                await browser.close()

    @classmethod
    async def compile_html_to_image(
        cls, html_content: str, image_format: str = "jpeg", quality: int = 95
    ) -> bytes:
        """
        Rend le HTML en mémoire et compile une image (JPEG/PNG) haute résolution 2x via Playwright.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page(
                    viewport={"width": 794, "height": 1123},
                    device_scale_factor=2,
                )
                await page.set_content(html_content, wait_until="load")
                img_bytes = await page.screenshot(
                    type=image_format,
                    quality=quality if image_format == "jpeg" else None,
                    full_page=True,
                )
                return img_bytes
            except Exception as e:
                logger.error(f"Erreur lors de la capture image Playwright : {e}")
                raise RuntimeError(f"Échec de la capture image Playwright : {e}") from e
            finally:
                await browser.close()
