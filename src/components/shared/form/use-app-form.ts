import { createFormHook } from '@tanstack/react-form'
import { CheckboxField } from '#/components/shared/form/checkbox-field'
import { DateField } from '#/components/shared/form/date-field'
import {
  fieldContext,
  formContext,
} from '#/components/shared/form/form-context'
import { NumberField } from '#/components/shared/form/number-field'
import { PasswordField } from '#/components/shared/form/password-field'
import { SelectField } from '#/components/shared/form/select-field'
import { TextareaField } from '#/components/shared/form/textarea-field'
import { TextField } from '#/components/shared/form/text-field'
import { TimeField } from '#/components/shared/form/time-field'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CheckboxField,
    DateField,
    NumberField,
    PasswordField,
    SelectField,
    TextareaField,
    TextField,
    TimeField,
  },
  formComponents: {},
})
