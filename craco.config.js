module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the rule that processes JS/JSX files
      const rules = webpackConfig.module.rules;
      const oneOfRule = rules.find((rule) => rule.oneOf);
      
      if (oneOfRule) {
        oneOfRule.oneOf.forEach((rule) => {
          // Find rules that process JS/JSX files
          if (rule.test && (
            rule.test.toString().includes('jsx') || 
            rule.test.toString().includes('js')
          )) {
            // Remove the include restriction that limits to src/ directory
            if (rule.include && Array.isArray(rule.include)) {
              // Keep src/ but also allow node_modules for react-refresh
              rule.include = [
                ...rule.include,
                /node_modules[\\/]react-refresh/
              ];
            } else if (rule.include && typeof rule.include === 'object') {
              // If it's a single path, convert to array
              rule.include = [
                rule.include,
                /node_modules[\\/]react-refresh/
              ];
            }
          }
        });
      }
      
      return webpackConfig;
    },
  },
};

