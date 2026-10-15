import logging
import subprocess
import sys
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

CHROMIUM_LAUNCH_ARGS = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
]


class PDFCompilerService:
    """
    Compilateur de PDF vectoriel ATS 1 page via Playwright (AD-7).
    Garantit un document vectoriel A4 avec texte sélectionnable natif.
    """

    @classmethod
    async def _launch_browser(cls, playwright_instance):
        """Lance le navigateur Chromium avec gestion robuste du bac à sable et auto-téléchargement si absent."""
        try:
            return await playwright_instance.chromium.launch(
                headless=True,
                args=CHROMIUM_LAUNCH_ARGS,
            )
        except Exception as e:
            err_msg = str(e)
            if "Executable doesn't exist" in err_msg or "playwright install" in err_msg:
                logger.warning("Chromium Playwright manquant sur le serveur. Tentative d'installation automatique...")
                try:
                    subprocess.run(
                        [sys.executable, "-m", "playwright", "install", "chromium"],
                        check=True,
                        timeout=180,
                    )
                    return await playwright_instance.chromium.launch(
                        headless=True,
                        args=CHROMIUM_LAUNCH_ARGS,
                    )
                except Exception as install_err:
                    logger.error(f"Échec de l'auto-installation de Chromium : {install_err}")
                    raise RuntimeError(f"Navigateur Chromium non disponible sur le serveur : {e}") from e
            raise

    @classmethod
    async def compile_html_to_pdf(cls, html_content: str) -> bytes:
        """
        Rend le HTML en mémoire et compile un PDF vectoriel A4 calibré pour 1 page.
        """
        async with async_playwright() as p:
            browser = await cls._launch_browser(p)
            try:
                page = await browser.new_page()
                await page.set_content(html_content, wait_until="domcontentloaded", timeout=15000)

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
            browser = await cls._launch_browser(p)
            try:
                page = await browser.new_page(
                    viewport={"width": 794, "height": 1123},
                    device_scale_factor=2,
                )
                await page.set_content(html_content, wait_until="domcontentloaded", timeout=15000)
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
