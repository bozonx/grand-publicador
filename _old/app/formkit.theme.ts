// app/formkit.theme.ts
export const rootClasses = {
  global: {
    outer: 'mb-6 group',
    label: 'block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors',
    inner: 'relative',
    input:
      'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
    help: 'text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1',
    message: 'text-red-500 text-xs mt-1 ml-1 font-medium',
    prefixIcon:
      'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors',
    suffixIcon:
      'absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors',
  },
  submit: {
    input:
      'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30 active:transform active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed',
    wrapper: 'mb-0',
  },
  textarea: {
    input: '!h-auto min-h-[120px] resize-y',
  },
  checkbox: {
    wrapper: 'flex items-center gap-3',
    inner: 'flex-shrink-0',
    input:
      'appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer relative after:content-[""] after:hidden checked:after:block after:absolute after:top-[2px] after:left-[6px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45',
    label: 'mb-0 flex-grow cursor-pointer select-none text-gray-700 dark:text-gray-200',
  },
  file: {
    fileItem: 'flex items-center gap-2 mb-2',
    fileList: 'mt-2',
    fileRemove: 'text-red-500 hover:text-red-700 cursor-pointer text-sm font-medium ml-auto',
  },
}
