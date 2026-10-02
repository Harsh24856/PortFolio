/* Run from the root layout before first paint: motion classes only exist
   when motion is wanted and scripting is on, and on the home page, the only
   one with a preloader, the scroll is held until the preloader hands over. */
export const bootScript = `(function(){var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('js-motion')}if(location.pathname==='/'){d.classList.add('is-loading')}})();`
