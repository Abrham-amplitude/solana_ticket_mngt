use anchor_lang::prelude::*;

declare_id!("EEKMpCf2cV96tUPoDkCdFpnfrTeGuXCZ1uYJaeBQKbjS");

#[program]
pub mod solanacontract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
