import antfu from '@antfu/eslint-config';

export default antfu(
	{
		type: 'lib',
		stylistic: {
			indent: 'tab',
			jsx: true,
			quotes: 'single',
			semi: true,
		},
		gitignore: true,
		typescript: {
			overrides: {
				'ts/consistent-type-imports': ['error', { prefer: 'no-type-imports' }],
				'ts/explicit-function-return-type': 'off',
				'ts/consistent-type-definitions': 'off',
				'ts/naming-convention': [
					'error',
					{
						selector: 'typeLike',
						format: ['PascalCase'],
					},
					{
						selector: 'typeAlias',
						format: ['PascalCase'],
						custom: {
							regex: '^T\\w{3,}$',
							match: true,
						},
					},
					{
						selector: 'interface',
						format: ['PascalCase'],
						custom: {
							regex: '^I\\w{3,}$',
							match: true,
						},
					},
					{
						selector: 'typeParameter',
						format: ['PascalCase'],
						custom: {
							regex: '^\\w+',
							match: true,
						},
					},
				],
			},
		},
		ignores: ['**/templates/**'],
	},
	{
		files: ['**/*.{ts,js}'],
		rules: {
			'no-useless-return': 'off',
			'no-console': 'off',
			'antfu/no-top-level-await': 'off',
			'eslint-comments/no-unlimited-disable': 'off',
			'unicorn/consistent-function-scoping': 'off',
			'style/newline-per-chained-call': 'warn',
			'node/prefer-global/process': 'off',
			'antfu/top-level-function': 'off',
			'jsdoc/check-param-names': 'off',
			'antfu/if-newline': 'off',
			'style/brace-style': ['error', '1tbs', {
				allowSingleLine: true,
			}],
			'style/max-len': ['warn', {
				code: 120,
				ignoreTrailingComments: true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals: true,
				ignoreComments: true,
				ignoreStrings: true,
				ignoreUrls: true,
				tabWidth: 4,
			}],
		},
	},
);
