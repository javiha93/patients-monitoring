import { fireEvent, screen } from '@testing-library/react'

/**
 * Simulates selecting an option in the custom portal-based Select component.
 * Clicks the combobox button to open the dropdown, then clicks the option text.
 */
export function selectOption(combobox, optionText) {
  fireEvent.click(combobox)
  const option = screen.getByText(optionText, { selector: '[data-select-dropdown] button span' })
  fireEvent.click(option)
}

/**
 * Finds a combobox by its currently displayed text.
 * Replaces getByDisplayValue for custom Select components.
 */
export function getSelectByDisplayText(text) {
  const comboboxes = screen.getAllByRole('combobox')
  return comboboxes.find(cb => cb.textContent.includes(text))
}

/**
 * Finds a combobox by clicking it and checking if a specific option value exists,
 * then closes it. Used to identify selects by their options (like the old s.options pattern).
 */
export function getSelectWithOption(optionText) {
  const comboboxes = screen.getAllByRole('combobox')
  for (const cb of comboboxes) {
    fireEvent.click(cb)
    const dropdown = document.querySelector('[data-select-dropdown]')
    if (dropdown) {
      const opts = dropdown.querySelectorAll('button span')
      const found = Array.from(opts).some(o => o.textContent === optionText)
      // Close dropdown
      fireEvent.keyDown(document, { key: 'Escape' })
      if (found) return cb
    }
  }
  return null
}
