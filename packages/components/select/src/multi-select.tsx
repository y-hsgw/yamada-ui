import {
  ui,
  forwardRef,
  useMultiComponentStyle,
  omitThemeProps,
  CSSUIObject,
  HTMLUIProps,
  ThemeProps,
} from '@yamada-ui/core'
import { Popover, PopoverTrigger } from '@yamada-ui/popover'
import { cx, getValidChildren, handlerAll, isArray, omitObject } from '@yamada-ui/utils'
import {
  cloneElement,
  CSSProperties,
  FC,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useMemo,
} from 'react'
import { SelectIcon, SelectClearIcon, SelectIconProps } from './select-icon'
import { SelectList, SelectListProps } from './select-list'
import {
  Value,
  useSelect,
  UseSelectProps,
  SelectDescendantsContextProvider,
  SelectProvider,
  useSelectContext,
} from './use-select'
import { OptionGroup, Option, UIOption } from './'

type Format = (value: string, index: number) => string

type MultiSelectOptions = {
  data?: UIOption[]
  component?: FC<{
    value: string | number
    displayValue: string
    index: number
    onRemove: MouseEventHandler<HTMLElement>
  }>
  format?: Format
  separator?: string
  isClearable?: boolean
  focusBorderColor?: string
  errorBorderColor?: string
  container?: Omit<HTMLUIProps<'div'>, 'children'>
  list?: Omit<SelectListProps, 'children'>
  icon?: SelectIconProps
  clearIcon?: SelectIconProps
}

export type MultiSelectProps = ThemeProps<'Select'> &
  Omit<UseSelectProps<(string | number)[]>, 'placeholderInOptions' | 'isEmpty'> &
  MultiSelectOptions

export const MultiSelect = forwardRef<MultiSelectProps, 'div'>((props, ref) => {
  const styles = useMultiComponentStyle('Select', props)
  let {
    className,
    defaultValue = [],
    component,
    format,
    separator,
    isClearable = true,
    noOfLines = 1,
    data = [],
    color,
    h,
    height,
    minH,
    minHeight,
    closeOnSelect = false,
    container,
    list,
    icon,
    clearIcon,
    children,
    ...computedProps
  } = omitThemeProps(props)

  const validChildren = getValidChildren(children)
  let computedChildren: ReactElement[] = []

  if (!validChildren.length && data.length) {
    computedChildren = data.map(({ label, value, ...props }, i) => {
      if (!isArray(value)) {
        return (
          <Option key={i} value={value} {...props}>
            {label}
          </Option>
        )
      } else {
        return (
          <OptionGroup key={i} label={label as string} {...(props as HTMLUIProps<'ul'>)}>
            {value.map(({ label, value, ...props }, i) =>
              !isArray(value) ? (
                <Option key={i} value={value} {...props}>
                  {label}
                </Option>
              ) : null,
            )}
          </OptionGroup>
        )
      }
    })
  }

  let isEmpty = !validChildren.length && !computedChildren.length

  const {
    value,
    setValue,
    setDisplayValue,
    descendants,
    formControlProps,
    getPopoverProps,
    getContainerProps,
    getFieldProps,
    placeholder,
    ...rest
  } = useSelect<(string | number)[]>({
    ...computedProps,
    defaultValue,
    placeholderInOptions: false,
    closeOnSelect,
    isEmpty,
  })

  h = h ?? height
  minH = minH ?? minHeight

  const onClear: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.stopPropagation()

      setValue([])
      setDisplayValue(undefined)
    },
    [setDisplayValue, setValue],
  )

  const css: CSSUIObject = {
    position: 'relative',
    w: '100%',
    h: 'fit-content',
    color,
    ...styles.container,
  }

  return (
    <SelectDescendantsContextProvider value={descendants}>
      <SelectProvider value={{ ...rest, value, placeholder, styles }}>
        <Popover {...getPopoverProps()}>
          <ui.div className='ui-multi-select' __css={css} {...getContainerProps(container)}>
            <PopoverTrigger>
              <MultiSelectField
                component={component}
                format={format}
                separator={separator}
                noOfLines={noOfLines}
                h={h}
                minH={minH}
                {...getFieldProps({}, ref)}
              />
            </PopoverTrigger>

            {isClearable && value.length ? (
              <SelectClearIcon
                {...clearIcon}
                onClick={handlerAll(clearIcon?.onClick, onClear)}
                {...omitObject(formControlProps, ['id'])}
              />
            ) : (
              <SelectIcon {...icon} {...omitObject(formControlProps, ['id'])} />
            )}

            {!isEmpty ? <SelectList {...list}>{children ?? computedChildren}</SelectList> : null}
          </ui.div>
        </Popover>
      </SelectProvider>
    </SelectDescendantsContextProvider>
  )
})

type MultiSelectFieldProps = HTMLUIProps<'div'> &
  Pick<MultiSelectOptions, 'component' | 'format' | 'separator'>

const defaultFormat: Format = (value) => value

const MultiSelectField = forwardRef<MultiSelectFieldProps, 'div'>(
  (
    { className, component, format = defaultFormat, separator = ',', noOfLines, h, minH, ...rest },
    ref,
  ) => {
    const { value, displayValue, onChange, placeholder, styles } = useSelectContext()

    const cloneChildren = useMemo(() => {
      if (!displayValue?.length) return <ui.span noOfLines={noOfLines}>{placeholder}</ui.span>

      if (component) {
        return (
          <ui.span noOfLines={noOfLines}>
            {(displayValue as string[]).map((displayValue, index) => {
              const onRemove: MouseEventHandler<HTMLElement> = (e) => {
                e.stopPropagation()

                onChange((value as Value[])[index])
              }

              const el = component({
                value: (value as Value[])[index],
                displayValue,
                index,
                onRemove,
              })

              const style: CSSProperties = {
                marginBlockStart: '0.125rem',
                marginBlockEnd: '0.125rem',
                marginInlineEnd: '0.25rem',
              }

              return el ? cloneElement(el, { style }) : null
            })}
          </ui.span>
        )
      } else {
        return (
          <ui.span noOfLines={noOfLines}>
            {(displayValue as string[]).map((value, index) => {
              const isLast = displayValue.length === index + 1

              return (
                <ui.span key={index} display='inline-block' me='0.25rem'>
                  {format(value, index)}
                  {!isLast ? separator : null}
                </ui.span>
              )
            })}
          </ui.span>
        )
      }
    }, [displayValue, format, noOfLines, onChange, placeholder, separator, component, value])

    const css: CSSUIObject = {
      paddingEnd: '2rem',
      h,
      minH,
      display: 'flex',
      alignItems: 'center',
      ...styles.field,
    }

    return (
      <ui.div
        ref={ref}
        className={cx('ui-multi-select-field', className)}
        __css={css}
        py={displayValue?.length && component ? '0.125rem' : undefined}
        {...rest}
      >
        {cloneChildren}
      </ui.div>
    )
  },
)