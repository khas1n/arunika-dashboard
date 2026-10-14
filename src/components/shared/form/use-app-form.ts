import { createFormHook } from '@tanstack/react-form'
import { CheckboxField } from '#/components/shared/form/checkbox-field'
import {
  fieldContext,
  formContext,
} from '#/components/shared/form/form-context'
import { NumberField } from '#/components/shared/form/number-field'
import { PasswordField } from '#/components/shared/form/password-field'
import { TextareaField } from '#/components/shared/form/textarea-field'
import { TextField } from '#/components/shared/form/text-field'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CheckboxField,
    NumberField,
    PasswordField,
    TextareaField,
    TextField,
  },
  formComponents: {},
})
