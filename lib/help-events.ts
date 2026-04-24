/**
 * Event bus minimale per aprire HelpDialog da qualsiasi punto dell'app.
 * Usato da: sidebar, header, PageHelpButton.
 * Ascoltato da: DashboardSearchLayer (che renderizza l'unica istanza di HelpDialog).
 */

export const OPEN_HELP_EVENT = "invigitrack-open-help"

export function openHelpDialog(tutorialId?: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(OPEN_HELP_EVENT, { detail: { tutorialId } }),
  )
}

export const OPEN_TOUR_EVENT = "invigitrack-open-tour"

export function openDashboardTour() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(OPEN_TOUR_EVENT))
}
