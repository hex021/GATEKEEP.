export interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  themeSlug: 'neo-tokyo' | 'solaris-74' | 'supernova-zero' | 'bathroom-vibes' | string;
  durationMs: number;
  audioSrc: string;
  albumArt: string;
  palette: [string, string, string, string]; // Hex codes for WebGL shader
  lyrics: { timeMs: number; text: string }[];
  vibeTag: string;
  storyQuote: string;
}

export const SPOTIFY_PLAYLIST_BATHROOM_VIBES_ID = '4pOrPwLnziVhg5Ux0mZ8rf';

export const BATHROOM_VIBES_TRACKS: DemoTrack[] = [
  {
    "id": "bv-5hc71nKsUgtwQ3z52KEKQk",
    "title": "Somebody Else",
    "artist": "The 1975",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 347520,
    "audioSrc": "/demo/bathroom-vibes/somebody-else.mp3",
    "albumArt": "/demo/covers/somebody-else.jpg",
    "palette": [
      "#05050A",
      "#1E1B4B",
      "#4F46E5",
      "#06B6D4"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "The rest I can do without",
    "lyrics": [
      {
        "timeMs": 22710,
        "text": "So I heard you found somebody else"
      },
      {
        "timeMs": 32240,
        "text": "And at first, I thought it was a lie"
      },
      {
        "timeMs": 41230,
        "text": "I took all my things that make sounds"
      },
      {
        "timeMs": 47070,
        "text": "The rest I can do without"
      },
      {
        "timeMs": 56610,
        "text": "I don't want your body"
      },
      {
        "timeMs": 59050,
        "text": "But I hate to think about you with somebody else"
      },
      {
        "timeMs": 66080,
        "text": "Our love has gone cold"
      },
      {
        "timeMs": 68530,
        "text": "You're intertwining your soul with somebody else"
      },
      {
        "timeMs": 75200,
        "text": "I'm looking through you"
      },
      {
        "timeMs": 76950,
        "text": "While you're looking through your phone"
      },
      {
        "timeMs": 79270,
        "text": "And then leaving with somebody else"
      },
      {
        "timeMs": 84720,
        "text": "No, I don't want your body"
      },
      {
        "timeMs": 87290,
        "text": "But I'm picturing your body with somebody else"
      },
      {
        "timeMs": 94580,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 99800,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 104310,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 109100,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 113230,
        "text": "And c'mon baby (I know)"
      },
      {
        "timeMs": 116800,
        "text": "This ain't the last time that I'll see your face"
      },
      {
        "timeMs": 122870,
        "text": "And c'mon baby (I know)"
      },
      {
        "timeMs": 126130,
        "text": "You said you'd find someone to take my place"
      },
      {
        "timeMs": 132630,
        "text": "I just don't believe that you have got it in you"
      },
      {
        "timeMs": 137250,
        "text": "'Cause we are just gonna keep doing it every time"
      },
      {
        "timeMs": 142210,
        "text": "I start to believe in anything you're saying"
      },
      {
        "timeMs": 147010,
        "text": "I'm reminded that I should be gettin' over it"
      },
      {
        "timeMs": 151950,
        "text": "I don't want your body"
      },
      {
        "timeMs": 154200,
        "text": "But I hate to think about you with somebody else"
      },
      {
        "timeMs": 161040,
        "text": "Our love has gone cold"
      },
      {
        "timeMs": 163420,
        "text": "You're intertwining your soul with somebody else"
      },
      {
        "timeMs": 170170,
        "text": "I'm looking through you"
      },
      {
        "timeMs": 171710,
        "text": "While you're looking through your phone"
      },
      {
        "timeMs": 174330,
        "text": "And then leaving with somebody else"
      },
      {
        "timeMs": 179820,
        "text": "No, I don't want your body"
      },
      {
        "timeMs": 182540,
        "text": "But I'm picturing your body with somebody else"
      },
      {
        "timeMs": 189720,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 194950,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 199490,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 204200,
        "text": "I don't want your body, I don't want your body"
      },
      {
        "timeMs": 209280,
        "text": "Get someone you love?"
      },
      {
        "timeMs": 211880,
        "text": "Get someone you need?"
      },
      {
        "timeMs": 214250,
        "text": "Fuck that, get money"
      },
      {
        "timeMs": 216240,
        "text": "I can't give you my soul"
      },
      {
        "timeMs": 217990,
        "text": "'Cause we're never alone"
      },
      {
        "timeMs": 218950,
        "text": "Get someone you love?"
      },
      {
        "timeMs": 221310,
        "text": "Get someone you need?"
      },
      {
        "timeMs": 223700,
        "text": "Fuck that, get money"
      },
      {
        "timeMs": 225850,
        "text": "I can't give you my soul"
      },
      {
        "timeMs": 227320,
        "text": "'Cause we're never alone"
      },
      {
        "timeMs": 228220,
        "text": "Get someone you love?"
      },
      {
        "timeMs": 230740,
        "text": "Get someone you need?"
      },
      {
        "timeMs": 232990,
        "text": "Fuck that, get money"
      },
      {
        "timeMs": 235150,
        "text": "I can't give you my soul"
      },
      {
        "timeMs": 236690,
        "text": "'Cause we're never alone"
      },
      {
        "timeMs": 238050,
        "text": "Get someone you love?"
      },
      {
        "timeMs": 240050,
        "text": "Get someone you need?"
      },
      {
        "timeMs": 242690,
        "text": "Fuck that, get money"
      },
      {
        "timeMs": 244700,
        "text": "I can't give you my soul"
      },
      {
        "timeMs": 246350,
        "text": "'Cause we're never alone"
      },
      {
        "timeMs": 265640,
        "text": "I don't want your body"
      },
      {
        "timeMs": 268210,
        "text": "But I hate to think about you with somebody else"
      },
      {
        "timeMs": 275040,
        "text": "Our love has gone cold"
      },
      {
        "timeMs": 277660,
        "text": "You're intertwining your soul with somebody else"
      },
      {
        "timeMs": 284360,
        "text": "I'm looking through you"
      },
      {
        "timeMs": 285850,
        "text": "While you're looking through your phone"
      },
      {
        "timeMs": 288410,
        "text": "And then leaving with somebody else"
      },
      {
        "timeMs": 293570,
        "text": "No, I don't want your body"
      },
      {
        "timeMs": 296610,
        "text": "But I'm picturing your body with somebody else"
      },
      {
        "timeMs": 304990,
        "text": "(I know, I know, I know)"
      },
      {
        "timeMs": 314360,
        "text": "(I know, I know, I know)"
      },
      {
        "timeMs": 323890,
        "text": "(I know, I know, I know)"
      },
      {
        "timeMs": 333480,
        "text": "(I know, I know, I know)"
      }
    ]
  },
  {
    "id": "bv-0rKtyWc8bvkriBthvHKY8d",
    "title": "SLOW DANCING IN THE DARK",
    "artist": "Joji",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 209273,
    "audioSrc": "/demo/bathroom-vibes/slow-dancing-in-the-dark.mp3",
    "albumArt": "/demo/covers/slow-dancing-in-the-dark.jpg",
    "palette": [
      "#0B0D17",
      "#312E81",
      "#EC4899",
      "#F59E0B"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "Waiting for you (waiting for you)",
    "lyrics": [
      {
        "timeMs": 22150,
        "text": "I don't want a friend"
      },
      {
        "timeMs": 25420,
        "text": "I want my life in two (life in two)"
      },
      {
        "timeMs": 31110,
        "text": "Waiting to get there"
      },
      {
        "timeMs": 36320,
        "text": "Waiting for you (waiting for you)"
      },
      {
        "timeMs": 45490,
        "text": "When I'm around slow dancing in the dark"
      },
      {
        "timeMs": 50870,
        "text": "Don't follow me, you'll end up in my arms"
      },
      {
        "timeMs": 55550,
        "text": "You done made up your mind"
      },
      {
        "timeMs": 58240,
        "text": "I don't need no more signs"
      },
      {
        "timeMs": 60910,
        "text": "Can you?"
      },
      {
        "timeMs": 63550,
        "text": "Can you?"
      },
      {
        "timeMs": 67410,
        "text": "Give me reasons we should be complete"
      },
      {
        "timeMs": 72790,
        "text": "You should be with him, I can't compete"
      },
      {
        "timeMs": 77860,
        "text": "You looked at me like I was someone else, oh, well"
      },
      {
        "timeMs": 84980,
        "text": "Can't you see?"
      },
      {
        "timeMs": 90140,
        "text": "I don't wanna slow dance (I don't wanna slow dance)"
      },
      {
        "timeMs": 95780,
        "text": "In the dark, dark"
      },
      {
        "timeMs": 108420,
        "text": "When you gotta run (gotta run, gotta run)"
      },
      {
        "timeMs": 111450,
        "text": "Just hear my voice in you (my voice in you)"
      },
      {
        "timeMs": 117160,
        "text": "Shutting me out you (shutting me out)"
      },
      {
        "timeMs": 122710,
        "text": "Doing so great (so great, so great)"
      },
      {
        "timeMs": 126250,
        "text": "You"
      },
      {
        "timeMs": 130750,
        "text": "Used to be the one to hold you when you fall"
      },
      {
        "timeMs": 136830,
        "text": "Yeah, yeah, yeah (when you fall, when you fall)"
      },
      {
        "timeMs": 139280,
        "text": "I don't fuck with your tone (I don't fuck with your tone)"
      },
      {
        "timeMs": 142040,
        "text": "I don't wanna go home (I don't wanna go home)"
      },
      {
        "timeMs": 144500,
        "text": "Can it be one night?"
      },
      {
        "timeMs": 147220,
        "text": "Can you?"
      },
      {
        "timeMs": 150040,
        "text": "Can you?"
      },
      {
        "timeMs": 153680,
        "text": "Give me reasons we should be complete"
      },
      {
        "timeMs": 159050,
        "text": "You should be with him, I can't compete"
      },
      {
        "timeMs": 164230,
        "text": "You looked at me like I was someone else, oh, well"
      },
      {
        "timeMs": 171130,
        "text": "Can't you see?"
      },
      {
        "timeMs": 176480,
        "text": "I don't wanna slow dance (I don't wanna slow dance)"
      },
      {
        "timeMs": 181750,
        "text": "In the dark, dark"
      },
      {
        "timeMs": 192750,
        "text": "In the dark, dark"
      }
    ]
  },
  {
    "id": "bv-6K4t31amVTZDgR3sKmwUJJ",
    "title": "The Less I Know The Better",
    "artist": "Tame Impala",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 216320,
    "audioSrc": "/demo/bathroom-vibes/the-less-i-know-the-better.mp3",
    "albumArt": "/demo/covers/the-less-i-know-the-better.jpg",
    "palette": [
      "#0F0F1A",
      "#374151",
      "#9CA3AF",
      "#38BDF8"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "Not the greatest feeling ever",
    "lyrics": [
      {
        "timeMs": 24590,
        "text": "Someone said they left together"
      },
      {
        "timeMs": 28570,
        "text": "I ran out the door to get her"
      },
      {
        "timeMs": 33090,
        "text": "She was holding hands with Trevor"
      },
      {
        "timeMs": 37040,
        "text": "Not the greatest feeling ever"
      },
      {
        "timeMs": 41000,
        "text": "Said, \"Pull yourself together"
      },
      {
        "timeMs": 45010,
        "text": "You should try your luck with Heather\""
      },
      {
        "timeMs": 49090,
        "text": "Then I heard they slept together"
      },
      {
        "timeMs": 53510,
        "text": "Oh, the less I know the better"
      },
      {
        "timeMs": 62020,
        "text": "The less I know the better"
      },
      {
        "timeMs": 66000,
        "text": "Oh my love, can't you see yourself by my side?"
      },
      {
        "timeMs": 74030,
        "text": "No surprise when you're on his shoulder like every night"
      },
      {
        "timeMs": 82050,
        "text": "Oh my love, can't you see that you're on my mind?"
      },
      {
        "timeMs": 91000,
        "text": "Don't suppose we could convince your lover to change his mind"
      },
      {
        "timeMs": 99020,
        "text": "So goodbye"
      },
      {
        "timeMs": 107020,
        "text": "She said, \"It's not now or never"
      },
      {
        "timeMs": 111050,
        "text": "Wait ten years, we'll be together\""
      },
      {
        "timeMs": 115020,
        "text": "I said, \"Better late than never"
      },
      {
        "timeMs": 119060,
        "text": "Just don't make me wait forever\""
      },
      {
        "timeMs": 128000,
        "text": "Don't make me wait forever"
      },
      {
        "timeMs": 136090,
        "text": "Don't make me wait forever"
      },
      {
        "timeMs": 140050,
        "text": "Oh my love, can't you see yourself by my side?"
      },
      {
        "timeMs": 148080,
        "text": "I don't suppose you could convince your lover to change his mind"
      },
      {
        "timeMs": 156590,
        "text": "I was doing fine without ya"
      },
      {
        "timeMs": 161050,
        "text": "'Til I saw your face, now I can't erase"
      },
      {
        "timeMs": 165040,
        "text": "Giving in to all his bullshit"
      },
      {
        "timeMs": 169040,
        "text": "Is this what you want? Is this who you are?"
      },
      {
        "timeMs": 173540,
        "text": "I was doing fine without ya"
      },
      {
        "timeMs": 177040,
        "text": "'Til I saw your eyes turn away from mine"
      },
      {
        "timeMs": 181580,
        "text": "Oh, sweet darling, where he wants you"
      },
      {
        "timeMs": 185040,
        "text": "Said, \"Come on Superman, say your stupid line\""
      },
      {
        "timeMs": 193510,
        "text": "Said, \"Come on Superman, say your stupid line\""
      },
      {
        "timeMs": 201570,
        "text": "Said, \"Come on Superman, say your stupid line\""
      }
    ]
  },
  {
    "id": "bv-4frLb7nWtsz2ymBE6k2GRP",
    "title": "Earned It (Fifty Shades Of Grey)",
    "artist": "The Weeknd",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 277680,
    "audioSrc": "/demo/bathroom-vibes/earned-it-fifty-shades-of-grey.mp3",
    "albumArt": "/demo/covers/earned-it-fifty-shades-of-grey.jpg",
    "palette": [
      "#09090E",
      "#581C87",
      "#D946EF",
      "#22D3EE"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "'Cause I see nobody, nobody but you, you, you",
    "lyrics": [
      {
        "timeMs": 5450,
        "text": "I'ma care for you"
      },
      {
        "timeMs": 13370,
        "text": "I'ma care for you, you, you, you"
      },
      {
        "timeMs": 40930,
        "text": "You make it look like it's magic (oh yeah)"
      },
      {
        "timeMs": 46410,
        "text": "'Cause I see nobody, nobody but you, you, you"
      },
      {
        "timeMs": 53910,
        "text": "I'm never confused"
      },
      {
        "timeMs": 56540,
        "text": "Hey, hey"
      },
      {
        "timeMs": 59060,
        "text": "I'm so used to being used"
      },
      {
        "timeMs": 62720,
        "text": "So I love when you call unexpected"
      },
      {
        "timeMs": 68720,
        "text": "'Cause I hate when the moment's expected"
      },
      {
        "timeMs": 73830,
        "text": "So I'ma care for you, you, you"
      },
      {
        "timeMs": 79410,
        "text": "I'ma care for you, you, you, you, yeah"
      },
      {
        "timeMs": 86570,
        "text": "'Cause girl, you're perfect"
      },
      {
        "timeMs": 90020,
        "text": "You're always worth it"
      },
      {
        "timeMs": 92530,
        "text": "And you deserve it"
      },
      {
        "timeMs": 95730,
        "text": "The way you work it"
      },
      {
        "timeMs": 98680,
        "text": "'Cause girl you earned it, yeah"
      },
      {
        "timeMs": 105050,
        "text": "Girl, you earned it, yeah"
      },
      {
        "timeMs": 113190,
        "text": "You know our love would be tragic (oh yeah)"
      },
      {
        "timeMs": 118840,
        "text": "So you don't pay it, don't pay it no mind"
      },
      {
        "timeMs": 125690,
        "text": "We live with no lies"
      },
      {
        "timeMs": 128670,
        "text": "Hey, hey"
      },
      {
        "timeMs": 131080,
        "text": "You're my favorite kind of night"
      },
      {
        "timeMs": 135180,
        "text": "So I love when you call unexpected"
      },
      {
        "timeMs": 140400,
        "text": "'Cause I hate when the moment's expected"
      },
      {
        "timeMs": 145830,
        "text": "So I'ma care for you, you, you"
      },
      {
        "timeMs": 151980,
        "text": "I'ma care for you, you, you, you, yeah"
      },
      {
        "timeMs": 158460,
        "text": "'Cause girl, you're perfect (girl, you're perfect)"
      },
      {
        "timeMs": 161960,
        "text": "You're always worth it (always worth it)"
      },
      {
        "timeMs": 165010,
        "text": "And you deserve it (and you deserve it)"
      },
      {
        "timeMs": 168040,
        "text": "The way you work it (the way you work it)"
      },
      {
        "timeMs": 170820,
        "text": "'Cause girl, you earned it, yeah (earned it)"
      },
      {
        "timeMs": 177170,
        "text": "Girl, you earned it, yeah"
      },
      {
        "timeMs": 183110,
        "text": "On that lonely night (lonely night)"
      },
      {
        "timeMs": 186450,
        "text": "You said it wouldn't be love"
      },
      {
        "timeMs": 188680,
        "text": "But we felt the rush (fell in love)"
      },
      {
        "timeMs": 192230,
        "text": "It made us believe it there was only us (only us)"
      },
      {
        "timeMs": 198390,
        "text": "Convinced we were broken inside, yeah, inside, yeah"
      },
      {
        "timeMs": 213050,
        "text": "'Cause girl, you're perfect (girl, you're perfect)"
      },
      {
        "timeMs": 215960,
        "text": "You're always worth it (you're always worth it)"
      },
      {
        "timeMs": 218810,
        "text": "And you deserve it (and you deserve it)"
      },
      {
        "timeMs": 222080,
        "text": "The way you work it (the way you work it)"
      },
      {
        "timeMs": 224770,
        "text": "'Cause girl, you earned it, yeah (you earned it)"
      },
      {
        "timeMs": 230990,
        "text": "Girl, you earned it, yeah (you earned it)"
      },
      {
        "timeMs": 239910,
        "text": "Na-na-na-na-na"
      },
      {
        "timeMs": 243000,
        "text": "Oh-oh-oh"
      },
      {
        "timeMs": 246130,
        "text": "Yeah, yeah"
      },
      {
        "timeMs": 249200,
        "text": "'Cause girl, you're perfect"
      },
      {
        "timeMs": 252160,
        "text": "The way you work it"
      },
      {
        "timeMs": 255020,
        "text": "You deserve it"
      },
      {
        "timeMs": 258040,
        "text": "Girl, you deserve it"
      },
      {
        "timeMs": 261060,
        "text": "Girl, you earned it, yeah, yeah"
      }
    ]
  },
  {
    "id": "bv-2QjOHCTQ1Jl3zawyYOpxh6",
    "title": "Sweater Weather",
    "artist": "The Neighbourhood",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 240400,
    "audioSrc": "/demo/bathroom-vibes/sweater-weather.mp3",
    "albumArt": "/demo/covers/sweater-weather.jpg",
    "palette": [
      "#140505",
      "#7F1D1D",
      "#F97316",
      "#FBBF24"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "In California, with my toes in the sand",
    "lyrics": [
      {
        "timeMs": 6990,
        "text": "And all I am is a man"
      },
      {
        "timeMs": 10490,
        "text": "I want the world in my hands"
      },
      {
        "timeMs": 14320,
        "text": "I hate the beach, but I stand"
      },
      {
        "timeMs": 18240,
        "text": "In California, with my toes in the sand"
      },
      {
        "timeMs": 21980,
        "text": "Use the sleeves of my sweater, let's have an adventure"
      },
      {
        "timeMs": 26150,
        "text": "Head in the clouds, but my gravity's centered"
      },
      {
        "timeMs": 29940,
        "text": "Touch my neck, and I'll touch yours"
      },
      {
        "timeMs": 33700,
        "text": "You in those little high-waisted shorts, oh"
      },
      {
        "timeMs": 38990,
        "text": "She knows what I think about"
      },
      {
        "timeMs": 41220,
        "text": "And what I think about"
      },
      {
        "timeMs": 42880,
        "text": "One love, two mouths"
      },
      {
        "timeMs": 44750,
        "text": "One love, one house"
      },
      {
        "timeMs": 46620,
        "text": "No shirt, no blouse"
      },
      {
        "timeMs": 48610,
        "text": "Just us, you find out"
      },
      {
        "timeMs": 50220,
        "text": "Nothing that I wouldn't wanna tell you about, no"
      },
      {
        "timeMs": 53090,
        "text": "'Cause it's too cold for you here and now"
      },
      {
        "timeMs": 60870,
        "text": "So let me hold both your hands in the holes of my sweater"
      },
      {
        "timeMs": 69450,
        "text": "And if I may just take your breath away"
      },
      {
        "timeMs": 71740,
        "text": "I don't mind if there's not much to say"
      },
      {
        "timeMs": 73510,
        "text": "Sometimes the silence guides our minds"
      },
      {
        "timeMs": 75450,
        "text": "So move to a place so far away"
      },
      {
        "timeMs": 78000,
        "text": "The goosebumps start to raise"
      },
      {
        "timeMs": 79480,
        "text": "The minute that my left hand meets your waist"
      },
      {
        "timeMs": 82060,
        "text": "And then I watch your face"
      },
      {
        "timeMs": 83180,
        "text": "Put my finger on your tongue 'cause you love to taste, yeah"
      },
      {
        "timeMs": 86040,
        "text": "These hearts adore"
      },
      {
        "timeMs": 87280,
        "text": "Everyone the other beats hardest for"
      },
      {
        "timeMs": 89420,
        "text": "Inside, this place is warm"
      },
      {
        "timeMs": 91350,
        "text": "Outside, it starts to pour"
      },
      {
        "timeMs": 93960,
        "text": "Coming down"
      },
      {
        "timeMs": 95110,
        "text": "One love, two mouths"
      },
      {
        "timeMs": 97050,
        "text": "One love, one house"
      },
      {
        "timeMs": 99050,
        "text": "No shirt, no blouse"
      },
      {
        "timeMs": 101030,
        "text": "Just us, you find out"
      },
      {
        "timeMs": 102680,
        "text": "Nothing that I wouldn't wanna tell you about, no, no, no"
      },
      {
        "timeMs": 107240,
        "text": "'Cause it's too cold for you here and now"
      },
      {
        "timeMs": 115090,
        "text": "So let me hold both your hands in the holes of my sweater"
      },
      {
        "timeMs": 122820,
        "text": "'Cause it's too cold for you here and now"
      },
      {
        "timeMs": 130540,
        "text": "So let me hold both your hands in the holes of my sweater, whoa, whoa"
      },
      {
        "timeMs": 140360,
        "text": "♪"
      },
      {
        "timeMs": 151980,
        "text": "Whoa, whoa, whoa"
      },
      {
        "timeMs": 156710,
        "text": "♪"
      },
      {
        "timeMs": 159550,
        "text": "Whoa, whoa, whoa"
      },
      {
        "timeMs": 167330,
        "text": "Whoa, whoa"
      },
      {
        "timeMs": 175130,
        "text": "Whoa, whoa, whoa"
      },
      {
        "timeMs": 179870,
        "text": "♪"
      },
      {
        "timeMs": 182980,
        "text": "Whoa, whoa"
      },
      {
        "timeMs": 188750,
        "text": "'Cause it's too cold for you here and now"
      },
      {
        "timeMs": 196450,
        "text": "So let me hold both your hands in the holes of my sweater"
      },
      {
        "timeMs": 204170,
        "text": "'Cause it's too cold for you here and now"
      },
      {
        "timeMs": 211920,
        "text": "Let me hold both your hands in the holes of my sweater"
      },
      {
        "timeMs": 221610,
        "text": "And it's too cold, it's too cold"
      },
      {
        "timeMs": 226210,
        "text": "The holes of my sweater"
      }
    ]
  },
  {
    "id": "bv-5E30LdtzQTGqRvNd7l6kG5",
    "title": "Daddy Issues",
    "artist": "The Neighbourhood",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 260163,
    "audioSrc": "/demo/bathroom-vibes/daddy-issues.mp3",
    "albumArt": "/demo/covers/daddy-issues.jpg",
    "palette": [
      "#07070F",
      "#1E293B",
      "#64748B",
      "#A855F7"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "I tell you that I'm thinking about",
    "lyrics": [
      {
        "timeMs": 23830,
        "text": "Take you like a drug"
      },
      {
        "timeMs": 34760,
        "text": "I taste you on my tongue (ah)"
      },
      {
        "timeMs": 46500,
        "text": "You ask me what I'm thinking about"
      },
      {
        "timeMs": 49470,
        "text": "I tell you that I'm thinking about"
      },
      {
        "timeMs": 52480,
        "text": "Whatever you're thinking about"
      },
      {
        "timeMs": 57910,
        "text": "Tell me something that I'll forget"
      },
      {
        "timeMs": 60870,
        "text": "And you might have to tell me again"
      },
      {
        "timeMs": 63500,
        "text": "It's crazy what you do for a friend"
      },
      {
        "timeMs": 67150,
        "text": "Go ahead and cry, little girl"
      },
      {
        "timeMs": 69940,
        "text": "Nobody does it like you do"
      },
      {
        "timeMs": 72650,
        "text": "I know how much it matters to you"
      },
      {
        "timeMs": 75570,
        "text": "I know that you got daddy issues"
      },
      {
        "timeMs": 78670,
        "text": "And if you were my little girl"
      },
      {
        "timeMs": 81140,
        "text": "I'd do whatever I could do"
      },
      {
        "timeMs": 83970,
        "text": "I'd run away and hide with you"
      },
      {
        "timeMs": 86870,
        "text": "I know that you got daddy issues, and I do too"
      },
      {
        "timeMs": 91280,
        "text": "I tried to write your name in the rain"
      },
      {
        "timeMs": 96530,
        "text": "But the rain never came, so I made with the sun"
      },
      {
        "timeMs": 102530,
        "text": "The shade"
      },
      {
        "timeMs": 105080,
        "text": "Always comes at the worst time (ah)"
      },
      {
        "timeMs": 110280,
        "text": "♪"
      },
      {
        "timeMs": 114460,
        "text": "You ask me what I'm thinking about"
      },
      {
        "timeMs": 117220,
        "text": "I tell you that I'm thinking about"
      },
      {
        "timeMs": 120170,
        "text": "Whatever you're thinking about (ah)"
      },
      {
        "timeMs": 125820,
        "text": "Tell me something that I'll forget"
      },
      {
        "timeMs": 128560,
        "text": "And you might have to tell me again"
      },
      {
        "timeMs": 131300,
        "text": "It's crazy what you do for a friend"
      },
      {
        "timeMs": 135070,
        "text": "Go ahead and cry, little girl"
      },
      {
        "timeMs": 137630,
        "text": "Nobody does it like you do"
      },
      {
        "timeMs": 140560,
        "text": "I know how much it matters to you"
      },
      {
        "timeMs": 143370,
        "text": "I know that you got daddy issues"
      },
      {
        "timeMs": 146310,
        "text": "And if you were my little girl"
      },
      {
        "timeMs": 148990,
        "text": "I'd do whatever I could do"
      },
      {
        "timeMs": 151730,
        "text": "I'd run away and hide with you"
      },
      {
        "timeMs": 154630,
        "text": "I know that you got daddy issues"
      },
      {
        "timeMs": 156970,
        "text": "I keep on trying to let you go"
      },
      {
        "timeMs": 160230,
        "text": "I'm dying to let you know"
      },
      {
        "timeMs": 163230,
        "text": "How I'm getting on"
      },
      {
        "timeMs": 168140,
        "text": "I didn't cry when you left at first"
      },
      {
        "timeMs": 171530,
        "text": "But now that you're dead it hurts"
      },
      {
        "timeMs": 174590,
        "text": "This time I gotta know"
      },
      {
        "timeMs": 177390,
        "text": "Where did my daddy go?"
      },
      {
        "timeMs": 179590,
        "text": "I'm not entirely here"
      },
      {
        "timeMs": 185060,
        "text": "Half of me has disappeared"
      },
      {
        "timeMs": 191560,
        "text": "Go ahead and cry, little boy"
      },
      {
        "timeMs": 194130,
        "text": "You know that your daddy did too"
      },
      {
        "timeMs": 196940,
        "text": "You know what your mama went through"
      },
      {
        "timeMs": 200140,
        "text": "You gotta let it out soon, just let it out"
      },
      {
        "timeMs": 202720,
        "text": "Go ahead and cry, little girl"
      },
      {
        "timeMs": 205370,
        "text": "Nobody does it like you do"
      },
      {
        "timeMs": 208380,
        "text": "I know how much it matters to you"
      },
      {
        "timeMs": 211000,
        "text": "I know that you got daddy issues"
      },
      {
        "timeMs": 214040,
        "text": "And if you were my little girl"
      },
      {
        "timeMs": 216500,
        "text": "I'd do whatever I could do"
      },
      {
        "timeMs": 219570,
        "text": "I'd run away and hide with you"
      },
      {
        "timeMs": 222360,
        "text": "I know that you got daddy issues, and I do too"
      },
      {
        "timeMs": 225470,
        "text": "And if you were my little girl"
      },
      {
        "timeMs": 227970,
        "text": "I'd do whatever I could do"
      },
      {
        "timeMs": 230830,
        "text": "I'd run away and hide with you"
      },
      {
        "timeMs": 233600,
        "text": "I know that you got daddy issues, and I do too"
      }
    ]
  },
  {
    "id": "bv-0wXuerDYiBnERgIpbb3JBR",
    "title": "Redbone",
    "artist": "Childish Gambino",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 326933,
    "audioSrc": "/demo/bathroom-vibes/redbone.mp3",
    "albumArt": "/demo/covers/redbone.jpg",
    "palette": [
      "#0A0014",
      "#4C1D95",
      "#C026D3",
      "#38BDF8"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "It made me put away my pride",
    "lyrics": [
      {
        "timeMs": 29800,
        "text": "Daylight"
      },
      {
        "timeMs": 32560,
        "text": "I wake up feeling like you won't play right"
      },
      {
        "timeMs": 38490,
        "text": "I used to know, but now that shit don't feel right"
      },
      {
        "timeMs": 44670,
        "text": "It made me put away my pride"
      },
      {
        "timeMs": 53790,
        "text": "So long"
      },
      {
        "timeMs": 56440,
        "text": "You made a nigga wait for some, so long"
      },
      {
        "timeMs": 62400,
        "text": "You make it hard for a boy like that to go wrong"
      },
      {
        "timeMs": 68610,
        "text": "I'm wishing I could make this mine, oh"
      },
      {
        "timeMs": 77390,
        "text": "If you want it, yeah"
      },
      {
        "timeMs": 80010,
        "text": "You can have it, oh, oh, oh"
      },
      {
        "timeMs": 83120,
        "text": "If you need it, ooh"
      },
      {
        "timeMs": 86000,
        "text": "We can make it, oh"
      },
      {
        "timeMs": 89530,
        "text": "If you want it"
      },
      {
        "timeMs": 92350,
        "text": "You can have it"
      },
      {
        "timeMs": 94600,
        "text": "But stay woke"
      },
      {
        "timeMs": 98020,
        "text": "Niggas creepin'"
      },
      {
        "timeMs": 101120,
        "text": "They gon' find you"
      },
      {
        "timeMs": 103750,
        "text": "Gon' catch you sleepin', ooh"
      },
      {
        "timeMs": 106920,
        "text": "Now stay woke"
      },
      {
        "timeMs": 110060,
        "text": "Niggas creepin'"
      },
      {
        "timeMs": 113400,
        "text": "Now don't you close your eyes"
      },
      {
        "timeMs": 119990,
        "text": "Too late"
      },
      {
        "timeMs": 122550,
        "text": "You wanna make it right, but now it's too late"
      },
      {
        "timeMs": 128480,
        "text": "My peanut butter chocolate cake with Kool-Aid"
      },
      {
        "timeMs": 134590,
        "text": "I'm trying not to waste my time"
      },
      {
        "timeMs": 143160,
        "text": "If you want it, oh"
      },
      {
        "timeMs": 146140,
        "text": "You can have it, you can have it"
      },
      {
        "timeMs": 149140,
        "text": "If you need it"
      },
      {
        "timeMs": 150250,
        "text": "You better believe in something"
      },
      {
        "timeMs": 152140,
        "text": "We can make it, oh"
      },
      {
        "timeMs": 155480,
        "text": "If you want it"
      },
      {
        "timeMs": 158140,
        "text": "You can have it, ah!"
      },
      {
        "timeMs": 163610,
        "text": "But stay woke (stay woke)"
      },
      {
        "timeMs": 167070,
        "text": "Niggas creepin' (they be creepin')"
      },
      {
        "timeMs": 170220,
        "text": "They gon' find you (they gon' find you)"
      },
      {
        "timeMs": 172620,
        "text": "Gon' catch you sleepin' (gon' catch you sleepin', put your hands up now, baby)"
      },
      {
        "timeMs": 175040,
        "text": "Ooh, now stay woke"
      },
      {
        "timeMs": 179060,
        "text": "Niggas creepin'"
      },
      {
        "timeMs": 182470,
        "text": "Now, don't you close your eyes"
      },
      {
        "timeMs": 187890,
        "text": "But stay woke (ooh)"
      },
      {
        "timeMs": 191180,
        "text": "Niggas creepin' (they gon' find you)"
      },
      {
        "timeMs": 194220,
        "text": "They gon' find you"
      },
      {
        "timeMs": 196720,
        "text": "Gon' catch you sleepin', ooh (gon' catch you)"
      },
      {
        "timeMs": 199780,
        "text": "Now stay woke"
      },
      {
        "timeMs": 203180,
        "text": "Niggas creepin'"
      },
      {
        "timeMs": 206200,
        "text": "Now, don't you close your eyes"
      },
      {
        "timeMs": 217800,
        "text": "How'd it get so scandalous?"
      },
      {
        "timeMs": 223760,
        "text": "Oh, how'd it get so scandalous?"
      },
      {
        "timeMs": 229930,
        "text": "Oh, oh, how'd it get"
      },
      {
        "timeMs": 238070,
        "text": "How'd it get"
      },
      {
        "timeMs": 244520,
        "text": "How'd it get so scandalous?"
      },
      {
        "timeMs": 253150,
        "text": "How'd it get so scandalous?"
      },
      {
        "timeMs": 301750,
        "text": "But stay woke"
      },
      {
        "timeMs": 310880,
        "text": "But stay woke"
      }
    ]
  },
  {
    "id": "bv-0EfsDEYaSjGYd66Pr881nq",
    "title": "Cry Baby",
    "artist": "The Neighbourhood",
    "album": "bathroom vibes",
    "themeSlug": "bathroom-vibes",
    "durationMs": 235160,
    "audioSrc": "/demo/bathroom-vibes/cry-baby.mp3",
    "albumArt": "/demo/covers/cry-baby.jpg",
    "palette": [
      "#040814",
      "#0369A1",
      "#0EA5E9",
      "#A855F7"
    ],
    "vibeTag": "Bathroom Vibes Playlist",
    "storyQuote": "I need to listen good",
    "lyrics": [
      {
        "timeMs": 20550,
        "text": "I think I talk too much"
      },
      {
        "timeMs": 25040,
        "text": "I need to listen, baby"
      },
      {
        "timeMs": 29440,
        "text": "I need to listen, baby"
      },
      {
        "timeMs": 33840,
        "text": "I need to listen good"
      },
      {
        "timeMs": 38340,
        "text": "I think I try too hard"
      },
      {
        "timeMs": 42780,
        "text": "How I look, what I do, what I'm sayin'"
      },
      {
        "timeMs": 46840,
        "text": "I spend too much time explainin' myself"
      },
      {
        "timeMs": 51510,
        "text": "I hope there's some time to change it"
      },
      {
        "timeMs": 54670,
        "text": "I can taste it, my heart's breakin', please don't say"
      },
      {
        "timeMs": 58320,
        "text": "That you know, when you know"
      },
      {
        "timeMs": 63620,
        "text": "I can't take it, I'm impatient, tell me, baby"
      },
      {
        "timeMs": 67240,
        "text": "Now I know, you should go"
      },
      {
        "timeMs": 71660,
        "text": "I know I'll fall in love with you, baby"
      },
      {
        "timeMs": 77270,
        "text": "And that's not what I wanna do"
      },
      {
        "timeMs": 80590,
        "text": "I hope you won't ever lie to me"
      },
      {
        "timeMs": 84980,
        "text": "And if you do, I know I won't be your cry baby"
      },
      {
        "timeMs": 91620,
        "text": "I think I worry a lot"
      },
      {
        "timeMs": 96120,
        "text": "I need to take it easy"
      },
      {
        "timeMs": 100580,
        "text": "I've got this anxious feeling"
      },
      {
        "timeMs": 104180,
        "text": "But it goes away for a minute when I'm with you, breathing"
      },
      {
        "timeMs": 108000,
        "text": "I can taste it, my heart's breakin', please don't say"
      },
      {
        "timeMs": 111600,
        "text": "That you know, when you know"
      },
      {
        "timeMs": 116960,
        "text": "I can't take it, I'm impatient, tell me, baby"
      },
      {
        "timeMs": 120330,
        "text": "Now I know, you should go"
      },
      {
        "timeMs": 124960,
        "text": "I know I'll fall in love with you, baby"
      },
      {
        "timeMs": 130520,
        "text": "And that's not what I wanna do"
      },
      {
        "timeMs": 133850,
        "text": "I hope you won't ever lie to me"
      },
      {
        "timeMs": 138350,
        "text": "And if you do, I know I won't be your cry baby"
      },
      {
        "timeMs": 143080,
        "text": "The Sun's coming out, but I'm feeling colder"
      },
      {
        "timeMs": 149240,
        "text": "♪"
      },
      {
        "timeMs": 151870,
        "text": "I can't wait 'til the drought is over"
      },
      {
        "timeMs": 160350,
        "text": "♪"
      },
      {
        "timeMs": 180560,
        "text": "I know I'll fall in love with you, baby"
      },
      {
        "timeMs": 186670,
        "text": "Yeah, that's just what I'll do"
      },
      {
        "timeMs": 189060,
        "text": "I hope you won't ever lie to me"
      },
      {
        "timeMs": 193820,
        "text": "And if you do, I know I won't be your cry baby"
      },
      {
        "timeMs": 198210,
        "text": "I know I'll fall in love with you, baby"
      },
      {
        "timeMs": 203750,
        "text": "And that's not what I wanna do"
      },
      {
        "timeMs": 207140,
        "text": "I hope you won't ever lie to me"
      },
      {
        "timeMs": 211780,
        "text": "And if you do, I know I won't be your cry baby"
      },
      {
        "timeMs": 215550,
        "text": "Cry baby, cry baby"
      },
      {
        "timeMs": 218390,
        "text": "I need to cry, baby"
      },
      {
        "timeMs": 220120,
        "text": "Cry baby, cry baby"
      },
      {
        "timeMs": 222880,
        "text": "You need to cry, baby"
      },
      {
        "timeMs": 224530,
        "text": "Cry baby, cry baby"
      },
      {
        "timeMs": 227180,
        "text": "We need to cry"
      },
      {
        "timeMs": 229550,
        "text": "And if we do, I know that would be alright"
      }
    ]
  }
];

export const DEMO_TRACKS: DemoTrack[] = [
  {
    "id": "demo-1",
    "title": "Apatheia (3 AM Drift)",
    "artist": "Kuro & The Ghost Circuit",
    "album": "Cold Chrome City",
    "themeSlug": "neo-tokyo",
    "durationMs": 142000,
    "audioSrc": "/demo/apatheia.mp3",
    "albumArt": "/demo/covers/neo-tokyo.svg",
    "palette": [
      "#05050A",
      "#0F172A",
      "#7C3AED",
      "#06B6D4"
    ],
    "vibeTag": "Late Night Rainy Highway",
    "storyQuote": "we burned the skyline just to feel the heat / now every ghost in the city knows your name",
    "lyrics": [
      {
        "timeMs": 0,
        "text": "(rain hitting the windshield)"
      },
      {
        "timeMs": 4200,
        "text": "headlights cutting through the haze"
      },
      {
        "timeMs": 8100,
        "text": "you said forever in a past tense voice"
      },
      {
        "timeMs": 13500,
        "text": "we burned the skyline just to feel the heat"
      },
      {
        "timeMs": 18200,
        "text": "now every ghost in the city knows your name"
      },
      {
        "timeMs": 24000,
        "text": "and i don't even try to change the station"
      },
      {
        "timeMs": 31000,
        "text": "(sub-bass echoes into silence)"
      },
      {
        "timeMs": 38500,
        "text": "neon reflections in the rear-view glass"
      },
      {
        "timeMs": 44200,
        "text": "counting down the exits until dawn breaks free"
      },
      {
        "timeMs": 51000,
        "text": "nothing left to say that hasn't burned away"
      },
      {
        "timeMs": 58000,
        "text": "(sub-bass swells beneath the tires)"
      }
    ]
  },
  {
    "id": "demo-2",
    "title": "Honey on the Tape",
    "artist": "Solaris Quintet",
    "album": "Via Veneto Sessions",
    "themeSlug": "solaris-74",
    "durationMs": 158000,
    "audioSrc": "/demo/solaris.mp3",
    "albumArt": "/demo/covers/solaris.svg",
    "palette": [
      "#1A0F0D",
      "#C2410C",
      "#D97706",
      "#FDBA74"
    ],
    "vibeTag": "Analog Kodachrome Golden Hour",
    "storyQuote": "heavy honey on the tape deck / running out of summers before we run out of youth",
    "lyrics": [
      {
        "timeMs": 0,
        "text": "(needle drops on warm vinyl)"
      },
      {
        "timeMs": 3500,
        "text": "golden hour through the venetian blinds"
      },
      {
        "timeMs": 8900,
        "text": "coffee cold on the glass table"
      },
      {
        "timeMs": 14200,
        "text": "heavy honey on the tape deck"
      },
      {
        "timeMs": 19800,
        "text": "running out of summers before we run out of youth"
      },
      {
        "timeMs": 26400,
        "text": "let the reel spin till it catches fire"
      },
      {
        "timeMs": 34000,
        "text": "(warm Rhodes solo takes over)"
      },
      {
        "timeMs": 41200,
        "text": "dust motes drifting through the sunlight ray"
      },
      {
        "timeMs": 48500,
        "text": "memories captured on magnetic ribbon"
      },
      {
        "timeMs": 55000,
        "text": "running sweet and slow like amber wine"
      },
      {
        "timeMs": 62000,
        "text": "(tape delay softly dissipating)"
      }
    ]
  },
  {
    "id": "demo-3",
    "title": "Collapsed Universe",
    "artist": "AURA 00",
    "album": "Zero Gravity Shift",
    "themeSlug": "supernova-zero",
    "durationMs": 135000,
    "audioSrc": "/demo/supernova.mp3",
    "albumArt": "/demo/covers/supernova.svg",
    "palette": [
      "#0F1117",
      "#4338CA",
      "#D946EF",
      "#84CC16"
    ],
    "vibeTag": "Zero-Gravity Hyper-Euphoria",
    "storyQuote": "don't blink / the entire universe collapsed into this four-bar loop",
    "lyrics": [
      {
        "timeMs": 0,
        "text": "(crystalline arpeggio rising)"
      },
      {
        "timeMs": 5100,
        "text": "gravity gave up at three past midnight"
      },
      {
        "timeMs": 9800,
        "text": "we are floating through the wireframe"
      },
      {
        "timeMs": 14500,
        "text": "don't blink"
      },
      {
        "timeMs": 17200,
        "text": "the entire universe collapsed into this four-bar loop"
      },
      {
        "timeMs": 22800,
        "text": "and nothing else matters right now"
      },
      {
        "timeMs": 28500,
        "text": "(massive euphoric drop)"
      },
      {
        "timeMs": 36000,
        "text": "frequency vibrating through the glass floor"
      },
      {
        "timeMs": 42500,
        "text": "hyper-speed photons dancing in sync"
      },
      {
        "timeMs": 49000,
        "text": "hold this moment until the world restarts"
      },
      {
        "timeMs": 56000,
        "text": "(iridescent reverb trails into the void)"
      }
    ]
  }
];

export const ALL_DEMO_TRACKS: DemoTrack[] = [...DEMO_TRACKS, ...BATHROOM_VIBES_TRACKS];
