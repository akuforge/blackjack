/* Blackjack Navigator — Learn topics and glossary, carried over from the iOS app (Localizable.xcstrings),
   with the factual fixes from its notes (S1747) and app-store/Pro references removed. */
const CONTENT = {
 "sections": [
  {
   "title": "Foundations",
   "topics": [
    {
     "id": "responsibleGaming",
     "title": "Playing Smart & Staying in Control",
     "body": "Blackjack is one of the best table games to learn because skill genuinely matters. But even perfect strategy doesn’t eliminate the house edge. The casino always has a mathematical advantage.\n\nSet a budget before you play and stick to it. Decide what you’re comfortable losing, and treat that as the cost of entertainment, like a concert ticket or a night out.\n\nSet a time limit too. It’s easy to lose track of time at the table. Fatigue leads to mistakes, and mistakes cost money.\n\nNever chase losses. If you’re down and tempted to bet bigger to win it back, that’s the worst time to increase your wager. The math doesn’t change because you’re behind.\n\nWalk away when you hit your stop-loss or your win goal. Locking in a win feels better than giving it all back. The table will be there tomorrow.\n\nWatch for warning signs: playing longer than planned, betting more than you can afford, feeling anxious or frustrated, or gambling to escape problems. If any of these sound familiar, take a break.\n\nHelp is available 24/7. National Council on Problem Gambling: 1-800-GAMBLER (US). Talk to someone if you or anyone you play with is showing warning signs."
    },
    {
     "id": "howToPlay",
     "title": "How to Play Blackjack",
     "body": "The goal is to get closer to 21 than the dealer without going over.\n\nNumber cards are worth their face value. Face cards (J, Q, K) are worth 10. Aces are worth 1 or 11, whichever helps your hand.\n\nYou’ll be dealt two cards. The dealer shows one card face-up. Then you decide: Hit (take another card), Stand (keep your hand), Double (double your bet and take one card), or Split (if you have a pair, play them as two separate hands).\n\nIf your total goes over 21, you bust and lose. If the dealer busts and you didn’t, you win. Otherwise, whoever is closer to 21 wins."
    },
    {
     "id": "houseEdge",
     "title": "What Is House Edge?",
     "body": "House edge is the percentage of each bet the casino expects to keep over time. A 0.5% house edge means for every $100 you bet, you’ll lose about 50 cents on average.\n\nBetter rules mean a lower house edge. Blackjack paying 3:2 instead of 6:5, dealer standing on soft 17, and having surrender available all reduce the edge.\n\nWith perfect strategy at a good table, the house edge can be as low as 0.28%. At a bad table (6:5 payout, H17), it can exceed 1.5%. Fewer decks usually help, but a 6:5 single-deck game is worse than a 3:2 six-deck shoe. The payout matters more than the deck count.\n\nThe Tables screen shows each table’s house edge so you can pick the best odds available."
    },
    {
     "id": "coaching",
     "title": "How the Coach Works",
     "body": "The coach grades every decision against basic strategy for the table you are sitting at: the decks, the dealer’s soft-17 rule, doubling and splitting rules, and surrender.\n\nFull Coaching shows the right play before you act, with a short reason and the expected value of every option. Best while you are learning the chart.\n\nHints only outlines the right button. No words, no numbers.\n\nThink First hides the answer until you act, then tells you whether you matched the chart and why. The best mode for practising.\n\nMistakes Only stays silent until you slip.\n\nOff plays a plain game. Your adherence is still tracked.\n\nExpected value (EV) is what an action returns per dollar of your original bet, on average. +0.25 means you win a quarter of your bet on average; −0.54 means you lose 54 cents. Double and split already count the extra money they put down. The coach ranks options by EV, but grades you by the chart. When the exact cards on the table make a different play very slightly better, the coach says so. That is composition-dependent strategy, a refinement beyond basic strategy."
    }
   ]
  },
  {
   "title": "Strategy",
   "topics": [
    {
     "id": "doublingDecision",
     "title": "Why Doubling Wins You Money",
     "body": "Doubling down is the most under-used profitable play in blackjack.\n\nWhen you double, you commit a second bet equal to your original, take exactly one more card, and stop. You give up the right to hit again, but you double the size of your win when the hand pays off.\n\nThe math works because some hands are tilted in your favor before the draw. A hard 11 against a dealer 6, for example, wins about 64% of the time. Doubling on that hand means you’re getting a second bet onto the table when you’re already favored, exactly when you want more money in play.\n\nThree doubling situations matter most: hard 9 vs dealer 3-6, hard 10 vs dealer 2-9, hard 11 vs anything except an Ace (an Ace too when the dealer hits soft 17). These are the “always double if allowed” hands. Skipping them costs real money over time. Your adherence in Stats shows whether you are leaving them on the table.\n\nDoubling has rules at the table. You can usually double on your first two cards only. Some tables let you double after a split (DAS), some don’t. The rule placard tells you which. Once you double, you cannot hit again, even if the card you get is small.\n\nWhen the table allows it, doubling on soft 13-18 versus weak dealer upcards (4, 5, 6) also pays. The strategy chart shows every doubling spot, and the coach explains each one as it comes up."
    },
    {
     "id": "splittingRule",
     "title": "Splitting: The Money Rule",
     "body": "Splitting takes a pair, separates the two cards into two new hands, and matches your bet on the second hand. You play each hand from there.\n\nTwo splits matter more than all the others combined: always split Aces, always split 8s.\n\nSplitting Aces gives you two hands starting at 11 each, the strongest position in the game. (Most tables limit you to one card per split Ace, but you still come out ahead.) Splitting 8s breaks up the worst single total in blackjack (a hard 16, where you bust on any 6+) into two hands starting at 8 each, which gives much better odds.\n\nTwo splits never make money: never split 10s, never split 5s. A 20 is already a near-lock winning hand. Splitting it trades a strong total for two weaker starts. A pair of 5s is a hard 10, which is a doubling candidate, not a split.\n\nThe other pairs depend on the dealer’s upcard. The strategy chart shows every case. Coaching will flag the close calls (4s, 6s, 7s, 9s) when they come up so you don’t have to memorize them all.\n\nOne mechanical note: you bet again when you split. Make sure your stack covers it. If it doesn’t, the table won’t let you split that hand."
    },
    {
     "id": "softHandsExplained",
     "title": "Soft Hands and Why They Matter",
     "body": "A soft hand is any hand that contains an Ace counted as 11. Soft 17 means an Ace plus a 6. Your total is either 7 or 17, your choice.\n\nSoft hands are different from hard hands because they cannot bust on the next card. Drawing any card to a soft 17 is safe because the Ace flips to a 1 if the new card would push you past 21. That safety is leverage.\n\nThis is why soft totals play differently than their hard counterparts. A hard 17 stands every time because drawing risks a bust. A soft 17 hits or doubles against weak dealer upcards, because you’re trading a mediocre total (17 ties or loses to most dealer hands) for a chance at a better one with zero bust risk.\n\nThe basic-strategy moves that surprise new players: soft 18 hits against dealer 9, 10, or Ace. Soft 17 doubles against dealer 3 through 6. Soft 13 through soft 18 are all double candidates depending on the dealer’s upcard.\n\nOne trap to know: when you see “soft 18” you may want to stand because 18 sounds strong. It’s not, against a 9 or 10. A dealer showing 9 reaches 19 or better often enough that 18 usually loses, not wins. The Ace gives you a free reroll on that, so take it.\n\nThe strategy chart has a separate row for every soft total. The chart also folds in the H17 vs S17 rule (whether the dealer hits or stands on soft 17), because that rule changes a few of your own soft-hand plays. “H17 vs S17: The Quiet 0.20% Rule” covers the dealer side in detail."
    },
    {
     "id": "insuranceMath",
     "title": "Insurance, Even Money, and the 33% Rule",
     "body": "When the dealer shows an Ace, the table offers insurance: a side bet that the dealer has blackjack. Insurance costs half your original bet and pays 2:1 if the dealer flips a 10.\n\nThe math: a 10-value card sits behind the Ace about 31% of the time (four of thirteen ranks are tens, a touch thinner once the Ace is out). For insurance to break even, that number would need to be 33.3% (one in three). Because insurance pays 2:1, the gap becomes a house edge of about 7.4% in a six-deck shoe, 6.8% in a double deck and 5.9% in a single deck. Fewer decks, smaller edge, but it is never positive off the top of the deck.\n\nThe shortcut: never take insurance. The bet loses money in the long run regardless of what your hand looks like, regardless of what the dealer’s upcard history has been, regardless of how strong your gut feeling is. The math doesn’t care about gut feelings.\n\nEven money is a special case. If you have a blackjack and the dealer shows an Ace, the dealer may offer “even money” paying you 1:1 instead of the 3:2 your blackjack normally earns. This is the same bet as insurance, dressed up. The expected value is worse than just letting the hand play out. Decline.\n\nThe one exception lives outside basic strategy: card counters sometimes take insurance when the count tells them the deck is rich in 10s. With Hi-Lo, insurance starts to pay at a true count of about +3. Without a count, the rule is simple: insurance, no; even money, no."
    },
    {
     "id": "surrenderWhenItPays",
     "title": "Surrender: When Folding Pays",
     "body": "Surrender lets you fold a hand before the dealer’s draw, giving up half your bet in exchange for getting out without losing the whole thing. When the math is right, it’s the cheapest way to lose.\n\nThe core surrenders: hard 16 against dealer 9, 10, or Ace, and hard 15 against dealer 10. When the dealer hits soft 17, add hard 15 and hard 17 against an Ace, and a pair of 8s against an Ace. In each of these spots, you lose more than 50% of your bet on average if you play the hand out, so handing back half is a real improvement.\n\nTake hard 16 vs dealer 10. Surrendering gives up 50 cents on the dollar; playing it out averages about 54 cents lost. Folding saves only a few cents each time, but over thousands of hands those cents add up to real money.\n\nTwo flavors exist at the casino. Late surrender (the common one) is offered after the dealer checks for blackjack. Early surrender (rare, mostly Atlantic City) is offered before the dealer peek and is more generous to the player. The rule placard shows which one is in play. Every table here uses late surrender. If the table has no surrender option, the play falls back to the next-best basic-strategy move, which for these surrender hands is a hit.\n\nWhen you do surrender, the dealer takes half your bet and your hand is done. You don’t see another card. Some tables signal surrender with a finger drag across the felt behind your bet. Here it is the Surrender button, shown only at tables that allow it."
    },
    {
     "id": "h17vsS17",
     "title": "H17 vs S17: The Quiet 0.20% Rule",
     "body": "Every blackjack table runs one of two rules on the dealer’s soft 17. H17 means the dealer hits soft 17; S17 means the dealer stands. The rule sits on the rule placard, usually in small text near the payout.\n\nS17 is better for the player. The dealer standing on soft 17 means the dealer busts more often when they would otherwise have drawn into a stronger total. The edge swing is about 0.20%, small per hand but real over a session.\n\nTranslated to dollars: at $10 a hand over 100 hands, an S17 table costs you about $2 less on average than an H17 table at the same payout. Over a weekend at the casino, the gap compounds with no extra skill required from you. Picking the right rule is free EV.\n\nH17 also changes a handful of your own basic-strategy plays. The most common: you double soft 19 against a dealer 6 at an H17 table (you wouldn’t at S17), and you surrender hard 17 against an Ace at H17 (you’d stand at S17). The strategy chart adjusts for the rule automatically. The chart here always shows the plays for the table you are sitting at.\n\nSide note: a 6:5 blackjack payout costs you about 1.39% in edge, about seven times the H17/S17 gap. The “Finding the Right Table” topic covers how to spot that one before you sit down. The short version: chase 3:2 first, then prefer S17 second."
    },
    {
     "id": "stats",
     "title": "Reading Your Stats",
     "body": "Session stats track your current sitting. All-time stats carry across sessions.\n\nWin Rate. About 43% of hands are wins, 9% push and 48% lose. A small edge comes from blackjacks paying 3:2 when they hit, which is roughly 4.7% of hands. Rules, payout, and adherence all move this band a little.\n\nStrategy Adherence. Aim for 95%+ to minimize the house edge. Each point above 95% measurably reduces your long-run loss. 99%+ is achievable with practice, and the gap between 95% and 99% is worth real money over a session.\n\nHouse Edge is the casino’s mathematical advantage. Lower is better for you. Stats compares what you should have lost at your tables’ edge with what actually happened: the gap is luck.\n\nNet Profit shows your total winnings or losses in dollars. Short-term results are mostly luck. Long-term results reflect how well you play.\n\nMistakes tells you which chart cells you miss most, and the Practice drill “Your weak spots” deals exactly those hands."
    },
    {
     "id": "cardCounting",
     "title": "Card Counting Basics",
     "body": "Card counting tracks which cards have been dealt to estimate what’s left in the shoe. When more high cards remain, the player has an edge.\n\nThe Running Count (RC) adds or subtracts based on each card dealt. In Hi-Lo, cards 2-6 are +1, 7-9 are 0, and 10-A are -1.\n\nThe True Count (TC) divides the running count by decks remaining. A TC of +2 or higher generally favors the player.\n\nPenetration shows how deep into the shoe the dealer has dealt. More penetration means the count is more reliable.\n\nCounters scale their bet to the count: bigger bets when the deck is rich in high cards, smaller bets when it isn’t. Turn on “Show the count” in Settings to see the Hi-Lo count while you play, and drill it in Practice."
    }
   ]
  },
  {
   "title": "At the Table",
   "topics": [
    {
     "id": "etiquette",
     "title": "Table Etiquette",
     "body": "Don’t touch your bet once the cards are dealt. At most tables, cards are dealt face-up, so don’t touch them.\n\nWait for the current hand to finish before sitting down or placing chips. Don’t give unsolicited advice to other players. Their money, their call.\n\nStack your chips correctly: highest denomination on the bottom, lowest on top. The dealer and cameras need to see your bet.\n\nKeep your phone off the table. Casinos take this seriously. Some won’t allow phones near the felt at all.\n\nIf you need to leave briefly, tell the dealer you’ll be right back. At pitch games (1-2 decks dealt by hand), you can place a chip on your cards to mark your spot."
    },
    {
     "id": "handSignals",
     "title": "Hand Signals",
     "body": "Casino dealers watch for hand signals because hands have to be visible on camera. Verbal calls don’t count.\n\nHit: Tap the table with one finger.\n\nStand: Wave a flat hand over your cards, palm down.\n\nDouble: Place a matching chip next to your bet, then point up.\n\nSplit: Place a matching chip next to your bet, then make a V with two fingers.\n\nSurrender: Trace a line behind your bet with your fingertip.\n\nAt a hand-held (pitch) game the signals differ: scratch the cards on the felt to hit, tuck them under your chips to stand."
    }
   ]
  },
  {
   "title": "Real Casino",
   "topics": [
    {
     "id": "findingTable",
     "title": "Finding the Right Table",
     "body": "Every table has a colored placard showing the table minimum, maximum, and key rules. Look for “Blackjack Pays 3 to 2” printed on the felt. Avoid tables that say 6 to 5.\n\nTable minimums change throughout the day. Weekday mornings are cheapest ($10-15), weekends and evenings go up ($25+). Some casino apps show live table minimums.\n\nHigh-limit rooms are separate areas with $100+ minimums, quieter atmosphere, and often better rules (fewer decks, dealer stands on soft 17).\n\nWhen you find a table, check: How many decks? Does the dealer hit or stand on soft 17? Is surrender offered? These details determine the house edge.\n\nIf all seats are taken, you can ask the dealer if a spot is saved. Some tables have a “No Mid-Shoe Entry” sign, so you’ll need to wait for a shuffle."
    },
    {
     "id": "payouts32vs65",
     "title": "3:2 vs 6:5 in Real Dollars",
     "body": "Blackjack pays a bonus when you hit a natural (Ace plus a 10-value card on your first two cards). The payout ratio is on every rule placard, and it is the single most important number on the table.\n\n3:2 pays $15 on a $10 bet. 6:5 pays $12 on a $10 bet. That’s $3 less per blackjack, and you’ll hit a natural about once every 21 hands. Over 100 hands, you’ll see roughly 4.7 naturals; the 3:2-vs-6:5 gap costs you about $14 over those 100 hands at a $10 bet.\n\nIn edge terms, 6:5 adds about 1.39% to the house edge. That’s a huge hit. A 3:2 game with otherwise decent rules runs around 0.5% house edge; the same game switched to 6:5 jumps past 1.8%. You’d play nearly four times worse on the same hands at the same bet.\n\n6:5 tables exist because they look approachable: lower minimums, single-deck shoes, fewer players. None of that compensates for the payout. A $5 minimum 6:5 single-deck game is mathematically worse than a $15 minimum 3:2 six-deck shoe. The “Finding the Right Table” topic walks through what to look for; the short version is: payout matters more than deck count, more than table fill, more than minimum bet.\n\nIf 6:5 is the only blackjack a casino offers, the math says walk. There are usually other casinos in driving distance. Other table games (baccarat, certain video poker variants) will treat your bankroll better than 6:5 blackjack ever will."
    },
    {
     "id": "buyingIn",
     "title": "Buying In at a Table",
     "body": "Wait for a break between hands, then take a seat. Place your cash flat on the felt in front of you. Never hand money directly to the dealer. The cameras need to see every transaction.\n\nSay “changing” and the amount. The dealer will spread your bills face-up, announce the amount, and push your chips across.\n\nMost tables have a minimum buy-in, usually 10-20x the table minimum. At a $25 table, bring at least $250-500.\n\nIf you have a players card, hand it to the dealer or place it on the felt. They’ll pass it to the pit boss to start tracking your play for comps."
    },
    {
     "id": "playersCard",
     "title": "Players Cards & Comps",
     "body": "Sign up at the players club desk. It’s free and takes two minutes. You’ll get a card with your name and member number.\n\nHand the card to the dealer when you sit down. They give it to the pit boss, who enters your info and starts rating your play. Ratings are based on average bet size and time at the table.\n\nRated play earns comps: free meals, hotel rooms, resort credits, cashback, and more. Even low-stakes players accumulate meaningful rewards over a trip.\n\nAlways play where you’re registered so your points accrue. If a casino brand owns multiple properties, your card usually works at all of them. Consolidate your play at one brand for better rewards.\n\nIf you change seats or tables, tell the pit boss so they can update your tracking. Otherwise your rated time resets and you lose credit for the play you’ve already put in.\n\nThere is zero downside to using a players card. It doesn’t change the cards, the odds, or how the dealer treats you. It only adds benefits."
    },
    {
     "id": "bankroll",
     "title": "Bankroll Basics",
     "body": "Only bring what you’re prepared to lose. A good rule of thumb: bring 20-40x your minimum bet for a session. At a $25 table, that’s $500-$1,000.\n\nNever chase losses by raising your bet. Stick to your standard wager and let the math work over time.\n\nSet a stop-loss for the session. If you lose your buy-in, walk away. Set a win goal too. Locking in a profit feels better than giving it all back.\n\nSeparate your gambling budget from your trip budget. If the bankroll runs out, switch to sightseeing."
    },
    {
     "id": "cashingOut",
     "title": "Cashing Out & Leaving",
     "body": "When you’re ready to leave, wait for the current hand to finish. Don’t stand up mid-deal.\n\nColor up your chips. Push your entire stack toward the dealer and say “color me up.” They need to see and count everything for the cameras. They’ll exchange your chips for fewer, higher-value ones that are easier to carry.\n\nTake your chips to the cashier cage to exchange them for cash. Most casinos also have redemption kiosks on the floor for smaller amounts.\n\nKnow when to leave. Set a win goal and a stop-loss before you sit down. Hit either one? Walk away. The table will be there tomorrow, but your bankroll might not be.\n\nSigns it’s time to go: you’re tired, frustrated, chasing losses, or playing hands on autopilot. Good players leave at the right time, not just when the money runs out.\n\nTip the dealer before you leave. A chip or two is customary. A polite “thanks for the game” goes a long way."
    },
    {
     "id": "tipping",
     "title": "Tipping at the Table",
     "body": "Tipping dealers is customary but not required. Common methods:\n\nPlace a bet for the dealer: Put a chip in front of your bet area. If you win, the dealer wins too.\n\nTip directly: Slide a chip toward the dealer between hands. Say “for you” or “for the dealers.”\n\nHow much? $1-$5 per winning hand is typical at low-stakes tables. Some players tip periodically rather than every hand.\n\nDealers remember good tippers and sometimes root for you (quietly). It also keeps the game friendly and pleasant for everyone at the table."
    },
    {
     "id": "myths",
     "title": "Common Myths",
     "body": "“Get as close to 21 as possible.” Nope. The goal is to beat the dealer. Standing on 12 against a 6 is correct because the dealer busts ~42% of the time (six decks, dealer stands on soft 17).\n\n“That guy took my card!” Other players’ decisions don’t affect your long-term results. Statistically, their mistakes help you as often as they hurt. Play your own hand.\n\n“I’m due for a win.” The gambler’s fallacy. Cards have no memory. Ten losses in a row doesn’t make the next hand more likely to win. Every deal is a fresh shuffle.\n\n“Always insure a good hand.” Insurance is a separate wager that pays 2:1 if the dealer completes a blackjack. To break even, the dealer would need at least 1 in 3 unseen cards to be a 10-value. In a fresh shoe only ~30.8% are, so insurance carries about a 7.4% house edge. It only pays off if you can count and know the actual ratio is high. Even with 20, declining insurance wins more over time.\n\n“Face cards are coming.” In a fresh shoe, every card is equally likely. You can’t will a 10 into existence. The only way to know what’s coming is card counting, and even that’s about probabilities, not certainties.\n\n“Blackjack is all luck.” Wrong. Perfect basic strategy reduces the house edge to under 0.5%. That’s the lowest edge of any table game. Skill absolutely matters."
    }
   ]
  },
  {
   "title": "Side Bets",
   "topics": [
    {
     "id": "sideBets",
     "title": "Side Bets Explained",
     "body": "Side bets are optional wagers placed alongside your main blackjack bet. They pay based on specific card combinations, not whether you beat the dealer.\n\nEvery side bet has a higher house edge than the main game. Blackjack runs 0.3 to 0.6% at standard 3:2 tables. The worst 6:5 short-pay tables push it past 1.9%, with single-deck 6:5 hitting ~1.8%. Side bets always run a multiple of that, even on a good blackjack table. They’re fun and add upside, but they cost you over time. Each bet shows exactly what you are paying.\n\nNot every bet is available at every table. Single-deck tables don’t offer side bets at all, and some bets require 4+ or 6+ decks to deal properly.\n\nThe topics below break down each of the seven bets: how it works, what the top payouts are, and whether the math makes it worth playing.\n\nEvery house edge here is computed by exact enumeration of every card combination for the number of decks in the shoe, and matches the Wizard of Odds figures where they publish one."
    },
    {
     "id": "sideBet.perfectPairs",
     "title": "Perfect Pairs",
     "body": "Perfect Pairs wins when your first two cards form a pair. Three tiers: Perfect Pair (same rank AND suit, like Q♥ Q♥) pays 25:1, Colored Pair (same rank, same color, different suit) pays 12:1, and Mixed Pair (same rank, different colors) pays 6:1.\n\nHouse edge varies dramatically by deck count: about 4.1% at 8 decks, 6.1% at 6 decks, and 10.1% at 4 decks. Not offered at 2-deck or 1-deck tables: the perfect-suited tier needs enough cards in the shoe to function.\n\nVerdict: Good recreational bet at 6 to 8 deck tables. The math gets brutal at 4-deck. Only play if you’re feeling lucky. Wins feel frequent because pairs hit roughly 1 in 13 hands.",
     "side": "pp"
    },
    {
     "id": "sideBet.twentyOnePlusThree",
     "title": "21+3",
     "body": "21+3 forms a 3-card poker hand from your first two cards plus the dealer’s upcard. Pays on any poker-qualifying combo.\n\nPayouts: Suited Trips (three of a kind, same suit) 100:1, Straight Flush 40:1, Three of a Kind 30:1, Straight 10:1, Flush 5:1. Flushes and straights hit often enough to keep the bet interesting.\n\nHouse edge: ~4.62% at 6-deck (the typical table). Drops to ~3.70% at 8-deck, but climbs to ~6.39% at 4-deck and ~11.2% at 2-deck. A near-universal casino offering.\n\nVerdict: Best frequency-and-upside mix at 8 decks, fair at 6 decks. Skip it at 4-deck and 2-deck tables, where the edge climbs steeply.",
     "side": "t3"
    },
    {
     "id": "sideBet.matchTheDealer",
     "title": "Match the Dealer",
     "body": "Match the Dealer wins when either of your first two cards matches the dealer’s upcard by rank. You can score zero, one, or two matches per hand.\n\nEach matching card pays separately, so two matches stack. At 6 decks a suited match pays 11:1 and unsuited 4:1, so two suited matches pay 22:1. Fewer decks raise the suited payout (19:1 at 2 decks) because matches get rarer.\n\nHouse edge: 3.7% at 8 decks, 4.1% at 6 decks, 4.8% at 4 decks, 3.3% at 2 decks. The richer low-deck payouts offset the rarer matches: 2-deck is actually the lowest edge.\n\nVerdict: Low-volatility bet with frequent small wins. Reasonable at any deck count. The 2-deck variant is quietly the best math.",
     "side": "md"
    },
    {
     "id": "sideBet.queensReward",
     "title": "Queens’ Reward",
     "body": "Queens’ Reward pays when your first two cards total exactly 20. Hitting 20 with Queens of Hearts specifically unlocks the jackpot tiers.\n\nTop payouts (multi-deck): Queen of Hearts pair + dealer blackjack 1000:1, Queen of Hearts pair 125:1, Matched 20 (same rank + same suit) 19:1, Suited 20 9:1, Any 20 4:1.\n\nHouse edge: about 24% at 6 and 8 deck tables, 26% at 4-deck, and 30% at 2-deck. The 2-deck version is punishing: you give up roughly $30 per $100 bet long-run.\n\nVerdict: Entertainment only. The jackpot headline is real, but the expected loss per dollar is severe. Play small amounts, briefly, and for the thrill. Not as a strategy.",
     "side": "qr"
    },
    {
     "id": "sideBet.threeCardPokerBonus",
     "title": "3-Card Poker Bonus",
     "body": "3-Card Poker Bonus uses the same mechanic as 21+3 (your two cards plus the dealer’s upcard) but with a premium paytable that replaces Suited Trips with Suited Royals (A-K-Q same suit).\n\nPayouts: Suited Royals 200:1, Straight Flush 50:1, Three of a Kind 30:1, Straight 10:1, Flush 5:1. The 200:1 top tier is the biggest standard payout on any 3-card bet.\n\nHouse edge: ~1.42% at 6 decks (just 0.77% at 8 decks). The lowest edge of the seven, beating even Lucky Lucky. Requires 6 or more decks.\n\nVerdict: If the table offers it, this is the side bet to play. Lowest edge, biggest top payout. Based on a real casino bet (Trilux Bonus), with a premium paytable.",
     "side": "cb"
    },
    {
     "id": "sideBet.threeCardPokerClassic",
     "title": "3-Card Poker Classic",
     "body": "3-Card Poker Classic is the companion bet to 3-Card Poker Bonus. Same mechanic: your two cards plus the dealer’s upcard, but with a lower top tier.\n\nPayouts: Suited Royals 100:1, Straight Flush 40:1, Three of a Kind 30:1, Straight 10:1, Flush 5:1. Matches 21+3 on the lower tiers.\n\nHouse edge: ~5.04% at 6 decks (4.38% at 8 decks). Requires 6 or more decks.\n\nVerdict: If both are offered, always pick Bonus: far better math at ~1.4%. Classic is the weaker bet, with a higher edge than 21+3 at both 6 and 8 decks. Play it small, if at all.",
     "side": "cc"
    },
    {
     "id": "sideBet.luckyLucky",
     "title": "Lucky Lucky",
     "body": "Lucky Lucky pays when your two cards plus the dealer’s upcard total 19, 20, or 21. Bonus payouts stack on suited 7-7-7 and suited 6-7-8 combinations.\n\nTop payouts: Suited 7-7-7 200:1, Suited 6-7-8 100:1, Unsuited 7-7-7 50:1, Unsuited 6-7-8 30:1, Suited 21 15:1. Any 19 and Any 20 pay 2:1 and hit often. Any other 21 pays 3:1.\n\nHouse edge: ~2.66% at 6 or more decks. One of the lowest edges of the seven, second only to 3-Card Poker Bonus (~1.4%).\n\nVerdict: Excellent grinder bet. Frequent small wins on any qualifying 19 to 21, with genuine lottery upside on the 7-7-7 jackpots. Worth playing when offered.",
     "side": "ll"
    }
   ]
  }
 ],
 "glossary": [
  {
   "term": "Hit",
   "def": "Take another card from the dealer to try to improve your hand total.",
   "cat": "Actions"
  },
  {
   "term": "Stand",
   "def": "Keep your current hand and end your turn.",
   "cat": "Actions"
  },
  {
   "term": "Double Down",
   "def": "Double your bet and receive exactly one more card. Best used when you have a strong advantage over the dealer.",
   "cat": "Actions"
  },
  {
   "term": "Split",
   "def": "When dealt a pair, separate them into two hands with independent bets. Each hand plays out on its own.",
   "cat": "Actions"
  },
  {
   "term": "Surrender",
   "def": "Give up your hand and get half your bet back. Only available before taking other actions, and only at certain tables.",
   "cat": "Actions"
  },
  {
   "term": "Bust",
   "def": "When a hand total goes over 21. An automatic loss, no matter what the dealer has.",
   "cat": "Outcomes"
  },
  {
   "term": "Push",
   "def": "A tie between you and the dealer. Your bet is returned: no win, no loss.",
   "cat": "Outcomes"
  },
  {
   "term": "Blackjack",
   "def": "An ace plus a ten-value card (10, J, Q, K) as your first two cards. Usually pays 3:2, which is $15 on a $10 bet.",
   "cat": "Outcomes"
  },
  {
   "term": "Natural",
   "def": "Another name for a blackjack: a two-card hand totaling 21.",
   "cat": "Outcomes"
  },
  {
   "term": "Face Card",
   "def": "A Jack, Queen, or King. All face cards are worth 10 points.",
   "cat": "Cards & Hands"
  },
  {
   "term": "Soft Hand",
   "def": "A hand where an ace is counted as 11, like Ace-6, which makes a “soft 17.” Since the ace can fall back to 1, you can take another card with no bust risk.",
   "cat": "Cards & Hands"
  },
  {
   "term": "Hard Hand",
   "def": "A hand with no aces, or where any ace must count as 1 to avoid busting. Less flexible than a soft hand.",
   "cat": "Cards & Hands"
  },
  {
   "term": "Pair",
   "def": "Two cards of the same rank in your starting hand (like two 8s). Pairs can be split into separate hands.",
   "cat": "Cards & Hands"
  },
  {
   "term": "Hand Total",
   "def": "The sum of all card values in your hand. The goal is to get closer to 21 than the dealer without going over.",
   "cat": "Cards & Hands"
  },
  {
   "term": "Shoe",
   "def": "A device holding multiple shuffled decks. The dealer slides cards out one at a time from the front. Single-deck and double-deck games typically skip the shoe and are dealt by hand (a “pitch game”).",
   "cat": "Table & Equipment"
  },
  {
   "term": "Deck",
   "def": "A standard 52-card set. Blackjack is usually played with 1, 2, 6, or 8 decks shuffled together.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Upcard",
   "def": "The dealer’s face-up card that everyone can see. Your strategy decisions are based on this card.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Hole Card",
   "def": "The dealer’s face-down card, hidden until all players finish their turns.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Cut Card",
   "def": "A colored plastic card placed in the shoe to mark when to reshuffle. Its position determines deck penetration.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Pit Boss",
   "def": "The casino supervisor who oversees a group of table games. They handle disputes, comps, and watch for cheating.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Basic Strategy",
   "def": "The correct play for every hand combination, derived from probability math. Stick to it and you keep the house edge as small as possible.",
   "cat": "Strategy"
  },
  {
   "term": "House Edge",
   "def": "The casino’s built-in mathematical advantage, shown as a percentage. At a good blackjack table with basic strategy, it can be as low as 0.28%.",
   "cat": "Strategy"
  },
  {
   "term": "Expected Value",
   "def": "The average amount you’d win or lose per bet over thousands of hands. Positive EV means profitable long-term; negative means the house wins.",
   "cat": "Strategy"
  },
  {
   "term": "Strategy Adherence",
   "def": "How often you make the correct play (per the probability-derived strategy). Higher adherence means smaller losses over time. Aim for 95% or better.",
   "cat": "Strategy"
  },
  {
   "term": "Win Rate",
   "def": "About 43% wins, 9% pushes, 48% losses on decided hands. The 3:2 blackjack payout supplies the small edge that keeps long-run loss bounded.",
   "cat": "Strategy"
  },
  {
   "term": "Card Counting",
   "def": "Tracking which cards have been dealt to estimate what’s left in the shoe. When more high cards remain, the player has a slight edge.",
   "cat": "Card Counting"
  },
  {
   "term": "Running Count",
   "def": "The raw tally kept during card counting. In Hi-Lo, add 1 for low cards (2–6) and subtract 1 for high cards (10–A).",
   "cat": "Card Counting"
  },
  {
   "term": "True Count",
   "def": "The running count divided by the number of decks left in the shoe. This gives a more accurate picture of your advantage.",
   "cat": "Card Counting"
  },
  {
   "term": "Hi-Lo",
   "def": "The most popular card counting system. Cards 2–6 count as +1, 7–9 as 0, and 10–Ace as −1.",
   "cat": "Card Counting"
  },
  {
   "term": "Penetration",
   "def": "How far into the shoe the dealer goes before reshuffling. More penetration makes card counting more effective.",
   "cat": "Card Counting"
  },
  {
   "term": "Bankroll",
   "def": "The total money you’ve set aside for playing. Good bankroll management means never risking more than you can afford to lose.",
   "cat": "Betting & Money"
  },
  {
   "term": "Buy-in",
   "def": "The amount of cash you exchange for chips when sitting down at a table.",
   "cat": "Betting & Money"
  },
  {
   "term": "Session",
   "def": "One continuous period of play at a table, from sitting down to cashing out.",
   "cat": "Betting & Money"
  },
  {
   "term": "Stake",
   "def": "The amount of money wagered on a single hand. Also called a bet or wager.",
   "cat": "Betting & Money"
  },
  {
   "term": "Stop-loss",
   "def": "A loss limit you set before playing. When you hit it, you walk away. Protects your bankroll from bad streaks.",
   "cat": "Betting & Money"
  },
  {
   "term": "Unit",
   "def": "Your standard bet size, used as a baseline. Usually the table minimum. Card counters vary their bets in units.",
   "cat": "Betting & Money"
  },
  {
   "term": "Insurance",
   "def": "A side bet offered when the dealer shows an ace. Pays 2:1 if the dealer has blackjack. Carries about a 7.4% house edge in a six-deck shoe (5.9% in a single deck). A bad bet unless you are counting.",
   "cat": "Rules & Variations"
  },
  {
   "term": "Even Money",
   "def": "Taking a guaranteed 1:1 payout on your blackjack when the dealer shows an ace, instead of risking a push if the dealer also has blackjack. It is the same bet as insurance. Declining wins more in the long run: taking it costs about 4% of your bet on average.",
   "cat": "Rules & Variations"
  },
  {
   "term": "Soft 17",
   "def": "A dealer hand totaling 17 with an ace counted as 11 (like Ace-6). Tables where the dealer hits soft 17 (H17) have a higher house edge than those where the dealer stands (S17).",
   "cat": "Rules & Variations"
  },
  {
   "term": "Payout",
   "def": "How much a winning bet returns, shown as a ratio. A 3:2 payout means you win $15 on a $10 bet. A 6:5 payout only wins $12.",
   "cat": "Rules & Variations"
  },
  {
   "term": "Chip",
   "def": "A token used in place of cash at the table. You exchange money for chips when buying in and exchange them back for cash at the cage when you’re done.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Felt",
   "def": "The cloth surface covering the blackjack table. It displays betting areas and house rules. Place cash on the felt to buy in; never hand money directly to the dealer.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Mid-Shoe Entry",
   "def": "Joining a table after cards have already been dealt from the shoe. Some tables display “No Mid-Shoe Entry” signs; you’ll need to wait for a shuffle before sitting down.",
   "cat": "Table & Equipment"
  },
  {
   "term": "H17",
   "def": "A rule where the dealer hits on soft 17. Slightly increases the house edge compared to S17, where the dealer stands. Check the table placard or felt for which rule applies.",
   "cat": "Rules & Variations"
  },
  {
   "term": "DAS",
   "def": "Double After Split: a rule that lets you double down on a hand after splitting a pair. Lowers the house edge for the player and changes a handful of pair-splitting decisions. Look for DAS or NDAS on the felt or table placard.",
   "cat": "Rules & Variations"
  },
  {
   "term": "Color Up",
   "def": "Exchange your chips for fewer, higher-denomination chips when leaving. Push your entire stack to the dealer and say “color me up”, and they count everything for the cameras.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Rack",
   "def": "The plastic tray in front of you that holds your chips. When you’re done, gather your chips from the rack and take them to the cashier.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Cage",
   "def": "The cashier’s window in the casino where you exchange chips for cash. Also called the cashier cage or cash-out window.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Pitch Game",
   "def": "A blackjack table where the dealer deals cards by hand rather than from a shoe. Usually 1-2 decks. Players hold their cards and use different hand signals than shoe games.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Table Minimum",
   "def": "The smallest bet allowed at a table, shown on a colored placard. Minimums change throughout the day: weekday mornings are cheapest, weekends and evenings go up.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Players Card",
   "def": "A free loyalty card from the casino that tracks your play and earns rewards. Hand it to the dealer when you sit down. There’s no downside to using one.",
   "cat": "Table & Equipment"
  },
  {
   "term": "Comps",
   "def": "Complimentary perks earned through rated play: free meals, hotel rooms, resort credits, and cashback. Even low-stakes players accumulate meaningful comps over a trip.",
   "cat": "Betting & Money"
  },
  {
   "term": "Rated Play",
   "def": "When a pit boss tracks your average bet size and time at the table using your players card. Rated play earns comps and loyalty rewards.",
   "cat": "Betting & Money"
  },
  {
   "term": "Win Goal",
   "def": "A profit target you set before playing. When you hit it, you lock in the win and walk away. Helps prevent giving back your gains.",
   "cat": "Betting & Money"
  },
  {
   "term": "Rat-Holing",
   "def": "Quietly pocketing some chips during play to lock in partial profits. Not against the rules, but some casinos frown on it.",
   "cat": "Betting & Money"
  },
  {
   "term": "Side Bet",
   "def": "An optional extra wager alongside your main bet. Pays out based on specific card combinations, not whether you beat the dealer.",
   "cat": "Side Bets"
  },
  {
   "term": "Volatility",
   "def": "How wildly results swing. High volatility means rare big wins and frequent small losses. Low volatility means more consistent, smaller results.",
   "cat": "Side Bets"
  }
 ]
};
