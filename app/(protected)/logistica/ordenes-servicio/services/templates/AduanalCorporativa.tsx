import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ServiceOrder } from "../../types/service-orders.types";
const CORP="#16213e",ACCENT="#0f3460",WARN="#d97706",WHITE="#ffffff",MID="#666666",BORDER="#cccccc",ALT="#f5f5f5";
const s=StyleSheet.create({
  page:{backgroundColor:WHITE,fontSize:8.5,color:CORP},header:{backgroundColor:CORP,padding:"18 28",flexDirection:"row",justifyContent:"space-between"},
  divider:{height:3,backgroundColor:WARN},infoBar:{backgroundColor:ALT,padding:"7 28",flexDirection:"row",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:BORDER},
  body:{padding:"12 28"},sTitle:{fontSize:8,fontWeight:"bold",color:CORP,textTransform:"uppercase",letterSpacing:1,marginBottom:6,borderBottomWidth:1,borderBottomColor:BORDER,paddingBottom:2},
  section:{marginBottom:10},row2:{flexDirection:"row",gap:12},col:{flex:1},
  tHead:{flexDirection:"row",backgroundColor:ACCENT,padding:"5 7"},tHTxt:{color:WHITE,fontSize:7.5,fontWeight:"bold",textTransform:"uppercase"},
  tRow:{flexDirection:"row",borderBottomWidth:1,borderBottomColor:BORDER,padding:"4 7"},
  tRowAlt:{flexDirection:"row",borderBottomWidth:1,borderBottomColor:BORDER,padding:"4 7",backgroundColor:ALT},
  cell:{fontSize:8},footer:{borderTopWidth:1,borderTopColor:BORDER,padding:"7 28"},fTxt:{fontSize:7,color:MID,textAlign:"center"},
});
type Props={order:ServiceOrder;settings:any};
export default function AduanalCorporativa({order,settings}:Props){
  const locale="es-MX",items=order.items??[],issuerName=settings?.fiscal_name??"Mobility OS";
  return(
    <Document><Page size="LETTER" style={s.page}>
      <View style={s.header}>
        <View>
          {settings?.logo_url?<Image src={settings.logo_url} style={{width:90,height:32,objectFit:"contain"}}/>:<Text style={{fontSize:16,fontWeight:"bold",color:WHITE}}>{issuerName}</Text>}
          <Text style={{color:"#94a3b8",fontSize:7,marginTop:3}}>{settings?.fiscal_rfc??"—"}</Text>
        </View>
        <View style={{alignItems:"flex-end"}}>
          <Text style={{fontSize:8,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Carta Instrucciones — Agente Aduanal</Text>
          <Text style={{fontSize:15,fontWeight:"bold",color:WHITE}}>{order.shipment?.reference??order.id.slice(0,8).toUpperCase()}</Text>
          <Text style={{fontSize:7.5,color:"#94a3b8",marginTop:2}}>{new Date(order.created_at).toLocaleDateString(locale,{year:"numeric",month:"long",day:"numeric"})}</Text>
        </View>
      </View>
      <View style={s.divider}/>
      <View style={s.infoBar}>
        {[{l:"Exportador",v:order.shipper_name??"—"},{l:"Consignatario",v:order.consignee_name??"—"},{l:"Transportista",v:order.carrier_name??"—"},{l:"Referencia",v:order.reference_number??"—"},{l:"RFC Emisor",v:settings?.fiscal_rfc??"—"}].map(r=>(
          <View key={r.l}><Text style={{fontSize:7,color:MID,textTransform:"uppercase"}}>{r.l}</Text><Text style={{fontSize:8,fontWeight:"bold",color:CORP}}>{r.v}</Text></View>
        ))}
      </View>
      <View style={s.body}>
        <View style={[s.section,s.row2]}>
          <View style={s.col}><Text style={s.sTitle}>Exportador / Importador</Text>
            {[order.shipper_name,order.shipper_address,[order.shipper_city,order.shipper_state].filter(Boolean).join(", "),order.shipper_phone].filter(Boolean).map((v,i)=><Text key={i} style={s.cell}>{v}</Text>)}
          </View>
          <View style={s.col}><Text style={s.sTitle}>Consignatario</Text>
            {[order.consignee_name,order.consignee_address,[order.consignee_city,order.consignee_state].filter(Boolean).join(", "),order.consignee_country].filter(Boolean).map((v,i)=><Text key={i} style={s.cell}>{v}</Text>)}
          </View>
        </View>
        {items.length>0&&(
          <View style={s.section}><Text style={s.sTitle}>Relación de mercancías</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt,{flex:1}]}>Descripción / Fracción arancelaria</Text>
              <Text style={[s.tHTxt,{width:"9%",textAlign:"right"}]}>Cant.</Text>
              <Text style={[s.tHTxt,{width:"8%",textAlign:"center"}]}>Unidad</Text>
              <Text style={[s.tHTxt,{width:"10%",textAlign:"right"}]}>kg</Text>
              <Text style={[s.tHTxt,{width:"13%",textAlign:"right"}]}>Valor USD</Text>
            </View>
            {items.map((item,i)=>(
              <View key={item.id} style={i%2===0?s.tRow:s.tRowAlt}>
                <View style={{flex:1}}>
                  <Text style={[s.cell,{fontWeight:"bold"}]}>{item.description}</Text>
                  {item.tariff_code&&<Text style={[s.cell,{color:MID,fontSize:7}]}>Fracción: {item.tariff_code} {item.tariff_description?`— ${item.tariff_description}`:""}</Text>}
                  {item.country_of_origin&&<Text style={[s.cell,{color:MID,fontSize:7}]}>País origen: {item.country_of_origin}</Text>}
                </View>
                <Text style={[s.cell,{width:"9%",textAlign:"right"}]}>{item.quantity}</Text>
                <Text style={[s.cell,{width:"8%",textAlign:"center",color:MID}]}>{item.unit}</Text>
                <Text style={[s.cell,{width:"10%",textAlign:"right"}]}>{item.weight_kg}</Text>
                <Text style={[s.cell,{width:"13%",textAlign:"right",fontWeight:"bold"}]}>{item.commercial_value>0?`$${item.commercial_value}`:"—"}</Text>
              </View>
            ))}
          </View>
        )}
        {order.special_instructions&&<View style={{backgroundColor:"#fff8e7",padding:"7 10",borderRadius:2,borderWidth:1,borderColor:WARN,marginTop:5}}><Text style={{fontSize:7.5,fontWeight:"bold",color:WARN,marginBottom:2}}>INSTRUCCIONES AL AGENTE ADUANAL</Text><Text style={{fontSize:8,color:CORP,lineHeight:1.5}}>{order.special_instructions}</Text></View>}
        <View style={{flexDirection:"row",gap:24,marginTop:16}}>
          {["Autoriza (Empresa)","Agente Aduanal","Recibido"].map(l=><View key={l} style={{flex:1,borderTopWidth:1,borderTopColor:BORDER,paddingTop:5}}><Text style={{fontSize:7,color:MID,textAlign:"center"}}>{l}</Text></View>)}
        </View>
      </View>
      <View style={s.footer}><Text style={s.fTxt}>{issuerName} · RFC: {settings?.fiscal_rfc??""} · {settings?.fiscal_address??""}</Text></View>
    </Page></Document>
  );
}
