with open('src/pages/InsuranceMaterials.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_truncate = '''function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export default function InsuranceMaterials() {'''

new_helpers = '''function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function parseNoteIds(noteIdsStr: string | null): string[] {
  if (!noteIdsStr) return []
  try {
    const parsed = JSON.parse(noteIdsStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function buildFullReferenceChain(note: IncidentNote, allNotes: IncidentNote[]): IncidentNote[][] {
  const noteMap = new Map<string, IncidentNote>()
  allNotes.forEach((n) => noteMap.set(n.id, n))
  const chains: Inciwith open('src/pages/InsuranceMaterials.tsx', 'r', encoding='utf-8') as f:
    content = f.reaidentN    content = f.read()

old_truncate = '''function truncateText(text: str l
old_truncate = '''fuing  if (text.length <= maxLength) return text
  ret& Array.isArray(currentNote.ref  return text.slice(0, maxLengtrencedIds = c}

export default function InsuranceMatee if 
new_helpers = '''function truncateText(text: sting  if (text.length <= maxLength) return text
  return text.slice(0, maxLength)}
  return textntNote.referenced_note_id && !r}

function parseNoteIds(noteIdsStr: strnced_  if (!noteIdsStr) return []
  try {
    const parsed = JSO_n  try {
    const parsed = id    conc    return Array.isArray(parsed) ? parseeM  } catch {
    return []
  }
}

function bui =    ret
      }
}

functh(}
wChai  const noteMap = new Map<string, IncidentNote>()
  allNotes.forEach((n) => noteMap.set(n.id, n))(i  allNotes.forEach((n) => noteMap.s    buildChains  const chains: Inciwith open('src/pages/Insur      content = f.reaidentN    content = f.read()

old_truncate = '''function truncateText(text
}
old_truncate = '''function truncateText(text: {'old_truncate = '''fuing  if (text.length <= maxLenlp  ret& Array.isArray(currentNote.ref  return text.slice(0, maxLen I
export default function InsuranceMatee if 
new_helpers = '''function truncateTe>()new_helpers = '''function truncateText(te)   return text.slice(0, maxLength)}
  return textntNote.referenced_note_id && !r}

function p =  return textntNote.referenced_no.f
function parseNoteIds(noif (!note.referenced_n  try {
    const parsed = JSO_n  try {
    const parsed = id    conch(    co,     const parsed = id    conc 
     return []
  }
}

function bui =    ret
      }
}

functh(}
wChai  const noteMd   }
}

functas}
ote.r      }
}

fun_id)) {
}

fun  const parent  allNotes.forEach((n) => noteMap.set(n.id, n))(i  alot
old_truncate = '''function truncateText(text
}
old_truncate = '''function truncateText(text: {'old_truncate = '''fuing  if (text.length <= maxLenlp  ret& Array.isArray(currentNote.ref  return ial}
old_truncate = '''function truncateText(tscueexport default function InsuranceMatee if 
new_helpers = '''function truncateTe>()new_helpers = '''function truncateText(te)   return text.slice(0, maxLength)}
  retuldnew_helpers = '''function truncateTe>()nech  return textntNote.referenced_note_id && !r}

function p =  return textntNote.referenced_no.f
function parseNoteIdol
function p =  return textntNote.referenced_erefunction parseNoteIds(noif (!note.referenced_nes    const parsed = JSO_n  try {
    const parsed = iot    const parsed = id    conchre     return []
  }
}

function bui =    ret
      }
}

functh(}
wChan)  }
}

functiui}
Chain      }
}

functh(}
te}

funay<InwCdentNot}

functas}
ote.r     ain: ote.r  nc}

fun_id))= [no}

fun  c let old_truncate = '''function truncateText(text
}
old_truncate = '''functiur}
old_truncate = '''function truncateText(tarenold_truncate = '''function truncateText(tscueexport default function InsuranceMatee if 
new_helpers = '''function truncateTe>()new_helpers = '''func  new_helpers = '''function truncateturn chain
    }
    const chains: Array<Array<Inciden  retuldnew_helpers = '''function truncateTe>()nech  return textntNote.referenced_note_id && !r}

function p =  ret  
function p =  return textntNote.referenced_no.f
function parseNoteIdol
function p =  return tensufunction parseNoteIdol
function p =  return tes function p =  return te    const parsed = iot    const parsed = id    conchre     return []
  }
}

function bui =    ret
      }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh(}
wChan)  }
}

functte}
ains)      }
}

functh(}
ha}

fun}'''
wChan) t }

functt.repChain   _b}

functh(}y, new_build_a
fmal
functas}
ote.r  plaote.r    
fun_id))= [no}

fun  c   {chains.length > }
old_truncate = '''functiur}
old_truncate = '''functi => old_truncate = '''function  new_helpers = '''function truncateTe>()new_helpers = '''func  new_helpers = '''function truncateturn chain
    }
    const chains:  f    }
    const chains: Array<Array<Inciden  retuldnew_helpers = '''function truncateTe>()nech  return tecl    am
function p =  ret  
function p =  return textntNote.referenced_no.f
function parseNoteIdol
function p =  return tensufunction parse   function p =  retublfunction parseNoteIdol
function p =  return te  function p =  return ryfunction p =  return tes function p =  return t    }
}

function bui =    ret
      }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh(}
wChan)  }  }
 }`}
      }
}

functh(}
  }

fun     wChan)i  }

functio           }
}

functh(}
OT}

funGORY_wChan) ch}

funct.category]}备}

functh(}.noteha}

fuce
f, 8wChan)  
functt.r   
functh(}y, new_builiv>fmal
functas}
ote.r    fun  ote.r  {cfun_id))= [no}

futh
fun  c   {ch   old_truncate = '''functiur    <div className="ml-4 borde    }
    const chains:  f    }
    const chains: Array<Array<Inciden  retuldnew_helpers = '''function truncateTe>()nech  return tecl    am
function p =  ret  
fil    e     const chains: Array<tefunction p =  ret  
function p =  return textntNote.referenced_no.f
function parseNoteIdol
function p =  r  function p =  retu  function parseNoteIdol
function p =  return te  function p =  return   function p =  return te  function p =  return ryfunction p =  return tes function p   }

function bui =    ret
      }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh           }
}

functh(}
  }

fun     wChan)i  }

functio    <      }
}

functh(}
  }

fun     wChan)    }`}
      as   me}

fun.5 h-  }

fund
f-fu
functio            }

functh(}
OT}

f     OT}

fu  
fchi
funce.category === 
functh(}.noteha}

   
fuce
f, 8wChan   f,   functt       functh(}y,e-functas}
ote.r    fun  ot  ote.r    
futh
fun  c   {ch   old_truncate = ory ===     const chains:  f    }
    const chains: Array<Array<Inciden  retuldnew_      const chains: Ar      function p =  ret  
fil    e     const chains: Array<tefunction p =  ret  
function p =  return textntNote  fil    e     const  function p =  return textntNote.referenced_no.f
funct??function parseNoteIdol
function p =  r  functi?unction p =  r        function p =  return te  function p =  return   function p  
function bui =    ret
      }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh           }
}

functh(}
  }

fun             }
}

functh(}
  }

funv>
  wChan)i  }

functio           }
}

functh     }

fun     }

functh(}
  }

       }

fu  
f   
functio    <       }

functh(}
  }

f    )  }

fu


fw_c      as   me}

fun.  
fun.5 h-  }
   
fund
f-fuhaif-flength 
functh(}
OT}

f      OT}

f   
f   
fu  
fc.mafchchfun, functh(}.noteha}

  
   
fuce
f, 8w   fu  f,   ote.r    fun  ot  ote.r    
futh
fun  c   {ch   o.jfuth
fun  c   {ch   old_trcefun1     const chains: Array<Array<Inciden  retuldnew_      const ceIfil    e     const chains: Array<tefunction p =  ret  
function p =  return textntNote  fil    -6function p =  return textntNote  fil    e     const    funct??function parseNoteIdol
function p =  r  functi?unction p =  r        function p =  return   function p =  r  functi?un  function bui =    ret
      }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh                   }
}

functh(}
 =}

funscue'wChan)i  }

functio           }
}

functh    ?}

funlue-5}

functh(}
  }

       }

fu  
f   }

functh(}
  }
te.ca  }

fu==
f'me  wCl'
functio      }

functh     }

f     
fun     }
bg-
functh(
    }

    
    
fu  
f   f    fun  
functh(}
  }

f   gor  }

f an
faly
fu


fw   
    
fun.  
fun.5 h-    fun.5     
fund
fmbfu-5f-f
 functh(}
OT}

f   OT}

f   
f   
f   
f    :f  g-fu enfc.0'
  
   
fuce
f, 8w   fu  f,         fu  f, }
futh
fun  c   {ch   o.jfuth
fun  c   {ch     fun  fun  c   {ch   old_tr  function p =  return textntNote  fil    -6function p =  return textntNote  fil    e     const    funct??function parseNoteIdol
function p =  r  f  function p =  r  functi?unction p =  r        function p =  return   function p =  r  functi?un  function bui =    ret
  =       }
}

functh(}
wChan)in  }
}

function bui =    ret
      }
}

functh                   }
}

functh(}
 =}

funscue'w')}

fun
    wChaite(c}

fnt)

print(      }修改完成")
