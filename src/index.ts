import '@logseq/libs';
import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

const pluginName = ["unfinished-business", "Unfinished Business"]
const markers = ['"TODO" "LATER" "DOING" "NOW"','"LATER" "NOW"','"TODO" "DOING"']
export const settingsTemplate: SettingSchemaDesc[] = [{
  key: "defaultTag",
  type: 'string',
  default: "testme",
  title: "default search tag?",
  description: "Use this for testing, or if you tag your tasks",
},
{
   key: "searchMarkers",
   type: 'enum',
   enumChoices: markers,
   enumPicker: 'radio',
   default: markers[1],
   title: "What markers to carry over to today?",
   description: "What markers should be moved, and which should stay?",
}
]
logseq.useSettingsSchema(settingsTemplate);
  
function journalYesterday() {
  //returns yesterdays date
  let date = (function(d){ d.setDate(d.getDate()-1); return d})(new Date)
  return parseInt(`${date.getFullYear()}${("0" + (date.getMonth()+1)).slice(-2)}${("0" + date.getDate()).slice(-2)}`,10)
}

async function parseQuery(queryTag, omniOK){
  // console.log("DB", queryTag,omniOK)
  let searchTag  = (queryTag) ? `[?b :block/path-refs [:block/name "${queryTag.toLowerCase().trim().replace(/^["'](.+(?=["']$))["']$/, '$1')}"]]
` : ""
  const omniSearch = (omniOK) ? "" : `[?p :block/journal? true] [?p :block/journal-day ${journalYesterday()}]`
  if (queryTag === "imsure" && omniOK) searchTag = ""

  // https://stackoverflow.com/questions/19156148/i-want-to-remove-double-quotes-from-a-string
  const query = `[:find (pull ?b [*])
    :where
    [?b :block/marker ?m]
    [(contains? #{${logseq.settings.searchMarkers}} ?m)]
    ${searchTag}
    [?b :block/page ?p]
    ${omniSearch}
    ]`
    // console.log("UB debug query", query);
    try { 
      const results = await logseq.DB.datascriptQuery(query) 
      return(results)
      // console.log("UB: parseQuery", results);
  } catch (error) {return false}
}

async function onTemplate(uuid){
  //is block(uuid) on a template?
  try {
    const block = await logseq.Editor.getBlock(uuid, {includeChildren: false})
    const checkTPL = (block.properties && block.properties.template != undefined) ? true : false
    const checkPRT = (block.parent != null && block.parent.id !== block.page.id)  ? true : false

    if (checkTPL === false && checkPRT === false) return false
    if (checkTPL === true )                       return true 
    return await onTemplate(block.parent.id) 

  } catch (error) { console.log(error) }
}

const main = async () => {
  //  FIXME do I want to give feedback? logseq.App.showMsg('❤️ Message from Hello World Plugin :)')
  logseq.provideModel({
  })
  console.log(pluginName[1],"has loaded")

  logseq.Editor.registerSlashCommand("Move unfinished business here", async () => {
    await logseq.Editor.insertAtEditingCursor(`{{renderer :unfinishedBusiness${logseq.settings.defaultTag ? ", "+logseq.settings.defaultTag : ""}}}`)})

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    try {
      if (payload.arguments[0].trim() !== ":unfinishedBusiness") return
      const taskTag = (payload.arguments.length > 1) ? payload.arguments[1] : "" 
      const omniOK  = (payload.arguments[2] === "imsure") ? true : false 

      //is the block on a template?
      const templYN = await onTemplate(payload.uuid)        
      // parseQuery returns false if no block can be found
      const blocks = await parseQuery(taskTag, omniOK)
      const color  = ( templYN === true ) ? "green" : "red"
      const errMsg = ( templYN === true ) ? "will run with template" : "Cannot find any (tagged) tasks"

      if ( templYN ||  blocks == false ) { 
          await logseq.provideUI({
          key: pluginName[0],
          slot,
          template: `<span style="color: ${color}">{{renderer ${payload.arguments} }}</span> (${errMsg})`,
          reset: true,
          style: { flex: 1 },
        })
        return 
      }
      else { 
        await logseq.Editor.updateBlock(payload.uuid, `**🚀 Moved ${blocks ?  blocks.length : "zero" } unfinished tasks ${omniOK ? "" : "from yesterday "}${ (taskTag) ? "(#"+taskTag+")" : "" }**` ) 
        blocks.forEach(async (item) => {
          await logseq.Editor.moveBlock(item[0].uuid['$uuid$'], payload.uuid, { before: true })
          // console.log("item:",item[0].uuid['$uuid$'])
        })
      }  
    } catch (error) { console.log(error) }
  })
}
logseq.ready(main).catch(console.error);
