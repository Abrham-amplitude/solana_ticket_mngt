use anchor_lang::prelude::*;

declare_id!("2mUirJGwKfWUtbqJkgLxPqWDJ5dsi66MYs9CmpZ4ZSGV");

#[program]
pub mod ticket_resell {
    use super::*;

    pub fn mint_ticket(ctx: Context<MintTicket>, ticket_data: String) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket_account;
        ticket.owner = ctx.accounts.user_wallet.key();
        ticket.metadata = ticket_data;
        ticket.price = 0;
        Ok(())
    }

    pub fn list_ticket_for_resell(ctx: Context<ListTicket>, price: u64) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket_account;
        require!(ticket.owner == ctx.accounts.user_wallet.key(), TicketError::InvalidOwner);
        ticket.price = price;
        Ok(())
    }

    pub fn transfer_ticket(ctx: Context<TransferTicket>, new_owner: Pubkey) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket_account;
        require!(ticket.owner == ctx.accounts.seller_wallet.key(), TicketError::InvalidOwner);
        ticket.owner = new_owner;
        ticket.price = 0; // Reset price after transfer
        Ok(())
    }

    pub fn get_ticket(ctx: Context<GetTicket>) -> Result<Ticket> {
        let ticket = &ctx.accounts.ticket_account;
        Ok(Ticket {
            owner: ticket.owner,
            metadata: ticket.metadata.clone(),
            price: ticket.price,
        })
    }
}

#[derive(Accounts)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account(init, payer = user_wallet, space = 8 + 32 + 1000 + 8)]
    pub ticket_account: Account<'info, Ticket>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListTicket<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account(mut)]
    pub ticket_account: Account<'info, Ticket>,
}

#[derive(Accounts)]
pub struct TransferTicket<'info> {
    #[account(mut)]
    pub seller_wallet: Signer<'info>,
    #[account(mut)]
    pub ticket_account: Account<'info, Ticket>,
    /// CHECK: We only use this as a reference for the new owner
    pub buyer_wallet: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct GetTicket<'info> {
    pub ticket_account: Account<'info, Ticket>,
}

#[account]
pub struct Ticket {
    pub owner: Pubkey,
    pub metadata: String,
    pub price: u64,
}

#[error_code]
pub enum TicketError {
    #[msg("Invalid ticket owner")]
    InvalidOwner,
} 