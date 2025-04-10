const allResourceTypes = Object.values(
	chrome.declarativeNetRequest.ResourceType,
)

export const rules = (origin: string): chrome.declarativeNetRequest.Rule[] => [
	{
		id: 1,
		priority: 1,
		action: {
			type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
			requestHeaders: [
				{
					operation: chrome.declarativeNetRequest.HeaderOperation.SET,
					header: 'Referer',
					value: origin,
				},
			],
		},
		condition: {
			urlFilter: '*',
			resourceTypes: allResourceTypes,
		},
	},
]
