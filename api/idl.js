module.exports = {
  version: "0.1.0",
  name: "ticket_resell",
  metadata: {
    address: "2mUirJGwKfWUtbqJkgLxPqWDJ5dsi66MYs9CmpZ4ZSGV",
  },
  instructions: [
    {
      name: "mintTicket",
      accounts: [
        {
          name: "userWallet",
          isMut: true,
          isSigner: true,
        },
        {
          name: "ticketAccount",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ticketData",
          type: "string",
        },
      ],
    },
    {
      name: "listTicketForResell",
      accounts: [
        {
          name: "userWallet",
          isMut: true,
          isSigner: true,
        },
        {
          name: "ticketAccount",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "price",
          type: "u64",
        },
      ],
    },
    {
      name: "transferTicket",
      accounts: [
        {
          name: "sellerWallet",
          isMut: true,
          isSigner: true,
        },
        {
          name: "ticketAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyerWallet",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "newOwner",
          type: "publicKey",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "Ticket",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "metadata",
            type: "string",
          },
          {
            name: "price",
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidOwner",
      msg: "Invalid ticket owner",
    },
  ],
};
