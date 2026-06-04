
export const products = [
  {
    id: "1",
    text: "Schema",
    expanded: true,
    items: [
      {
        id: "984d6fec-2fe7-4c01-b7ca-2e62f8d7df93",
        text: "Setting",
        Type: "Schema",
        expanded: false,
        items: [
          {
            id: "93d4aa87-b06a-4ed5-bc0b-f2286219a45",
            text: "Video Players",
            Type: "Action"
          },
          {
            id: "93d4aa87-b06a-4ed5-bc0b-f22862195a45",
            text: "Televisions",
            Type: "Action"
          },
          {
            id: "233e3ce5-8c6d-4316-bed8-62436550a0e8",
            text: "Monitors",
            Type: "Action"
          },
          {
            id: "cd909359-3df5-48f8-b34d-243369ebebd9",
            text: "Projectors",
            Type: "Action"
          }
        ]
      },
      {
        id: "267bc9ca-9213-465f-a7f2-a928626a8b77",
        text: "Template",
        Type: "Schema",
        items: [
          {
            id: "1_2_1",
            text: "Video Players",
            Type: "Action"
          },
          {
            id: "1_2_2",
            text: "Televisions",
            icon: 'images/products/1.png',
            Type: "Action"
          },
          {
            id: "1_2_3",
            text: "Monitors",
            Type: "Action"
          }
        ]
      },
      {
        id: "3d0e5318-25c5-4a1a-90b2-8bc4c98be0d0",
        text: "E-Mart",
        Type: "Schema",
        items: [
          {
            id: "1_3_1",
            text: "Video Players",
            Type: "Action"
          },
          {
            id: "66ecd0bc-6e52-453c-a8f9-8a31e2640a2c",
            text: "Monitors",
            Type: "Action"
          }
        ]
      },
      {
        id: "77261271-c55b-4bfd-8b29-5e718ba1dd39",
        text: "Walters",
        Type: "Schema",
        items: [
          {
            id: "1_4_1",
            text: "Video Players",
            Type: "Action"
          },
          {
            id: "1_4_2",
            text: "Televisions",
            Type: "Action"
          },
        ]
      }
    ]
  }
];

export const menuItemss = [
  { id: 'expand', text: 'Expand category' },
  { id: 'collapse', text: 'Collapse category' },
  { id: 'details', text: 'Show product details' },
  { id: 'copy', text: 'Copy product info' },
];



export const TreeViewData = [
  {
    DisplayName: "Subscription Extension",
    Status: "PUBLISHED",
    SystemName: "SubscriptionExtension",
    id: "90fe514d-fbbd-40e4-ab08-c7aadc085a9d",
    Type: 'Schema',
    expanded: false,
    Action: [
      {
        id: "98214c00-cc7e-4779-a39f-0d26a4b2810f",
        DisplayName: "List SubscriptionExtension",
        Status: "DRAFT",
        Type: 'Action'
      },
      {
        id: "fdc9ee4d-245f-4a25-a122-4512b6d22419",
        DisplayName: "Get SubscriptionExtension",
        Status: "DRAFT",
        Type: 'Action'
      },
      {
        id: "ead210bd-996e-4122-b25f-243f632c8f30",
        DisplayName: "Create SubscriptionExtension",
        Status: "DRAFT",
        Type: 'Action'
      },
      {
        id: "37c4dbc0-f90f-4222-bcfa-1eb2b763bd03",
        DisplayName: "Update SubscriptionExtension",
        Status: "DRAFT",
        Type: 'Action'
      },
      {
        id: "654d3e2d-212d-4dc8-a134-a24a5ca2354f",
        DisplayName: "Paging SubscriptionExtension",
        Status: "DRAFT",
        Type: 'Action'
      },
    ]
  },
  {
    DisplayName: "Pages",
    Status: "PUBLISHED",
    SystemName: "Pages",
    id: "7e49ebdb-044c-46b1-a067-f7fbbe52963d",
    Type: 'Schema',
    expanded: false,
    Action: [
      { id: "12f4a167-dcc6-4c70-b454-4f5957a7c721", DisplayName: "List Pages", Status: "DRAFT", Type: 'Action' },
      { id: "99613cd9-bb66-4b15-ae6e-d6c5c257b245", DisplayName: "Get Pages", Status: "DRAFT", Type: 'Action' },
      { id: "26722b20-f56d-4fd8-8fe2-381f32b4be15", DisplayName: "Create Pages", Status: "DRAFT", Type: 'Action' },
      { id: "37c4dbc0-f90f-4222-bcfa-1eb2b763bd3", DisplayName: "Update SubscriptionExtension", Type: 'Action' },
      { id: "75cf6a0a-c814-4ba4-9d7e-c72a95d8bb15", DisplayName: "Update Pages", Status: "DRAFT", Type: 'Action' },
      { id: "654d3e2d-212d-4dc8-a134-a24a5ca2354", DisplayName: "Paging SubscriptionExtension", Type: 'Action' }
    ]
  }
]