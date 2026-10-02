/* Inlined at the top of the home page so it runs before first paint: motion
   classes only exist when motion is wanted and scripting is on, and the
   preloader holds the scroll until it hands over. */
export const bootScript = `(function(){var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('js-motion')}d.classList.add('is-loading')})();`
