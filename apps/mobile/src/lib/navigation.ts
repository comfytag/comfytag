import type { NavigationProp, ParamListBase } from '@react-navigation/native'

// Structural subset of NavigationProp that's compatible with both the
// generically-typed props screens get (StackNavigationProp<X, 'Y'>) and the
// loosely-typed one plain `useNavigation()` returns — real nav objects
// satisfy this regardless of which flavor TS inferred at the call site.
interface NavigatorLike {
  navigate: (name: string) => void
  getState: () => { routeNames: string[] } | undefined
  getParent: () => NavigatorLike | undefined
}

/**
 * Walks up the navigator tree from `navigation` until it finds one whose
 * routeNames include `routeName`, then navigates there. Guest screens can be
 * nested arbitrarily deep (e.g. Checkout -> DiscoverStack -> attendee tab
 * navigator -> guest stack), so a single `getParent()` isn't always enough
 * to reach Login/Register.
 */
export function navigateUpTo(navigation: NavigatorLike, routeName: string): boolean {
  let nav: NavigatorLike | undefined = navigation
  while (nav !== undefined) {
    if (nav.getState()?.routeNames.includes(routeName) === true) {
      nav.navigate(routeName)
      return true
    }
    nav = nav.getParent()
  }
  return false
}

/**
 * Home and OrderConfirmation are mounted both inside the attendee tab
 * navigator (which has this route) and inside the guest stack (which
 * doesn't, since guests aren't authenticated yet). Route to the tab if
 * the current parent has it, otherwise send the guest to Login instead
 * of letting `navigate` throw "not handled by any navigator".
 */
export function navigateToTabOrLogin(
  navigation: NavigationProp<ParamListBase>,
  routeName: string
): void {
  const parent = navigation.getParent()
  if (parent?.getState().routeNames.includes(routeName) === true) {
    parent.navigate(routeName)
  } else {
    navigateUpTo(navigation, 'Login')
  }
}
