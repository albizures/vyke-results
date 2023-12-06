import antfu from '@antfu/eslint-config'

export default antfu(
	{
		typescript: true,
		stylistic: {
			indent: 'tab',
		},
		ignores: ['**/.tshy/**/*'],
	},
	{
		rules: {
			'ts/array-type': ['error', { default: 'generic', readonly: 'generic' }],
			'ts/consistent-type-definitions': ['error', 'type'],
			'ts/indent': 'off',
			'ts/no-redeclare': 'off',
			'ts/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],
			'arrow-parens': ['error', 'always'],
			'style/arrow-parens': ['error', 'always'],
			'curly': ['error', 'all'],
			'indent': 'off',
			'antfu/consistent-list-newline': 'off',
		},
	},
)
