import { Style } from '@glitz/type';
import * as React from 'react';
import { Context } from '../GlitzProvider';

export interface StyledComponent<TProps> extends React.ComponentClass<TProps & CSSProp & InnerRefProp> {}

export type StyledProps = {
  apply: () => string | undefined;
  compose: (style?: Style) => Style | Style[];
};

export type StyledElementProps = {
  className?: string;
};

export type CSSProp = {
  css?: Style | Style[];
};

export type InnerRefProp = {
  innerRef?: React.Ref<any>;
};

type InnerType<TProps> = React.ComponentType<TProps & StyledProps> | StyledComponent<TProps> | string;

function passingProps(props: any) {
  const newProps = { ...props };

  delete newProps.css;

  if (newProps.innerRef) {
    newProps.ref = newProps.innerRef;
    delete newProps.innerRef;
  }

  return newProps;
}

const ASSIGN_METHOD = '__GLITZ_ASSIGN';

function isStyledComponent<TProps>(inner: InnerType<TProps>): inner is StyledComponent<TProps> {
  return typeof inner === 'function' && ASSIGN_METHOD in inner;
}

function isCustomComponent<TProps>(inner: InnerType<TProps>): inner is React.ComponentType<TProps & StyledProps> {
  return typeof inner === 'function';
}

export function create<TProps>(
  inner: React.ComponentType<TProps & StyledProps> | StyledComponent<TProps> | string,
  originalStaticStyle: Style[],
): StyledComponent<TProps> {
  if (isStyledComponent(inner)) {
    // @ts-ignore
    return inner[ASSIGN_METHOD](originalStaticStyle);
  }

  let cache: string | null = null;

  class GlitzStyled extends React.Component<TProps & CSSProp & InnerRefProp> {
    public static contextTypes = {
      glitz: () => null, // Just pass the damn thing
    };
    public static displayName: string;
    public static [ASSIGN_METHOD](assigningStyle?: Style) {
      return create(inner, assigningStyle ? originalStaticStyle.concat(assigningStyle) : originalStaticStyle);
    }
    protected apply: () => string | undefined;
    protected compose: (additionalStyle?: Style) => Style | Style[];
    constructor(props: TProps, context: Context) {
      super(props, context);

      const staticStyle: Style | Style[] = context.glitz.deep
        ? originalStaticStyle
        : originalStaticStyle.length < 2 ? originalStaticStyle[0] || {} : flatten(originalStaticStyle);

      this.apply = () => {
        const styles: Style | Style[] = this.compose();

        if (!styles) {
          return;
        }

        const isPure = styles === staticStyle;

        if (isPure && cache) {
          return cache;
        }

        const classNames = context.glitz.glitz.injectStyle(styles);

        cache = isPure ? classNames : null;

        return classNames;
      };

      this.compose = additionalStyle => {
        const dynamicStyle: Style | Style[] | undefined = this.props.css;

        if (!dynamicStyle && !additionalStyle) {
          return staticStyle;
        }

        const styles = ([] as Style[]).concat(staticStyle, dynamicStyle || [], additionalStyle || []);

        if (context.glitz.deep) {
          return styles;
        } else if (styles.length < 2) {
          return styles[0] || {};
        } else {
          return flatten(styles);
        }
      };

      this.render = isCustomComponent(inner)
        ? () => {
            const passProps: TProps & StyledProps = passingProps(this.props);

            passProps.apply = this.apply;
            passProps.compose = this.compose;

            return React.createElement(inner, passProps);
          }
        : () => {
            const passProps: TProps & StyledElementProps = passingProps(this.props);

            passProps.className = passProps.className ? passProps.className + ' ' + this.apply() : this.apply();

            return React.createElement(inner, passProps);
          };
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    GlitzStyled.displayName = `Styled(${
      typeof inner === 'string' ? inner : inner.displayName || inner.name || 'Unknown'
    })`;
  }

  return GlitzStyled;
}

function flatten(styles: Style[]) {
  const result: Style = {};
  for (const chunk of styles) {
    let property: keyof Style;
    for (property in chunk) {
      result[property] = chunk[property];
    }
  }

  return result;
}
