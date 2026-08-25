declare const __LILY_SDK_VERSION__: string | undefined;

/** The package version injected by the build, with a fallback for source usage. */
export const PACKAGE_VERSION =
  typeof __LILY_SDK_VERSION__ === 'string' ? __LILY_SDK_VERSION__ : '0.1.0';
