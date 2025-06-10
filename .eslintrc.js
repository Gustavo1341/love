module.exports = {
  extends: ['react-app'],
  rules: {
    // Add any custom rules here
  },
  // This overrides the behavior of treating warnings as errors during CI builds
  ignorePatterns: ['build/', 'node_modules/'],
}; 