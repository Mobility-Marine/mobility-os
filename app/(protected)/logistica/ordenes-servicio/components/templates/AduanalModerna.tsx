import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ServiceOrder } from "../../types/service-orders.types";
const BLUE="#2563eb",DARK="#0f172a",MID="#475569",LIGHT="#f1f5f9",WHITE="#ffffff",BORDER="#e2e8f0",WARN="#d97706";
const s=StyleSheet.create({
  page:{backgroundColor:WHITE,fontSize:8.5,color:DARK},topBar:{backgroundColor:WARN,height:5},
  header:{padding:"18 36",flexDirection:"row",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:BORDER},
  body:{padding:"14 36"},sTitle:{fontSize:7.5,color:WARN,fontWeight:"bold",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,borderBottomWidth:1.5,borderBottomColor:WARN,paddingBottom:2},
  section:{marginBottom:10},row2:{flexDirection:"row",gap:14},col:{flex:1},
  lbl:{fontSize:7,color:MID,marginBottom:1.5},val:{fontSize:8.5,color:DARK,fontWeight:"bold",marginBottom:3},
  tHead:{flexDirection:"row",borderBottomWidth:2,borderBottomColor:WARN,paddingBottom:4},
  tHTxt:{fontSize:7.5,color:WARN,fontWeight:"bold",textTransform:"uppercase"},
  tRow:{flexDirection:"row",borderBottomWidth:1,borderBottomColor:BORDER,paddingVertical:4},
  tRowAlt:{flexDirection:"row",borderBottomWidth:1,borderBottomColor:BORDER,paddingVertical:4,backgroundColor:LIGHT},
  cell:{fontSize:8},footer:{borderTopWidth:1,borderTopColor:BORDER,padding:"8 36",flexDirection:"row",justifyContent:"space-between"},fTxt:{fontSize:7,color:MID},
});
type Props={order:ServiceOrder;settings:any};
export default function AduanalModerna({order,settings}:Props){
  const locale="es-MX",items=order.items??[],issuerName=settings?.fiscal_name??"Mobility OS";
  return(
    <Document><Page size="LETTER" style={s.page}>
      <View style={s.topBar}/>
      <View style={s.header}>
        <View>
          {settings?.logo_url?<Image src={settings.logo_url} style={{width:90,height:32,objectFit:"contain"}}/>:<Text style={{fontSize:16,fontWeight:"bold",color:DARK}}>{issuerName}</Text>}
          <Text style={{fontSize:7,color:MID,marginTop:2}}>RFC: {settings?.fiscal_rfc??"—"}</Text>
        </View>
        <View style={{alignItems:"flex-end"}}>
          <Text style={{fontSize:8,color:MID,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Carta de Instrucciones — Agente Aduanal</Text>
          <Text style={{fontSize:16,fontWeight:"bold",color:WARN}}>{order.shipment?.reference??order.id.slice(0,8).toUpperCase()}</Text>
          <Text style={{fontSize:7.5,color:MID,marginTop:2}}>{new Date(order.created_at).toLocaleDateString(locale,{year:"numeric",month:"long",day:"numeric"})}</Text>
        </View>
      </View>
      <View style={s.body}>
        <View style={[s.section,s.row2]}>
          <View style={s.col}><Text style={s.sTitle}>Exportador / Importador</Text>
            {[order.shipper_name,order.shipper_address,[order.shipper_city,order.shipper_state].filter(Boolean).join(", "),order.shipper_phone].filter(Boolean).map((v,i)=><Text key={i} style={s.cell}>{v}</Text>)}
          </View>
          <View style={s.col}><Text style={s.sTitle}>Consignatario</Text>
            {[order.consignee_name,order.consignee_address,[order.consignee_city,order.consignee_state].filter(Boolean).join(", "),order.consignee_country,order.consignee_phone].filter(Boolean).map((v,i)=><Text key={i} style={s.cell}>{v}</Text>)}
          </View>
          <View style={s.col}><Text style={s.sTitle}>Cruce</Text>
            {[order.carrier_name,order.reference_number&&`Ref: ${order.reference_number}`].filter(Boolean).map((v,i)=><Text key={i} style={s.cell}>{v}</Text>)}
          </View>
        </View>
        {items.length>0&&(
          <View style={s.section}><Text style={s.sTitle}>Mercancías</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt,{flex:1}]}>Descripción</Text>
              <Text style={[s.tHTxt,{width:"14%"}]}>Fracción</Text>
              <Text style={[s.tHTxt,{width:"9%",textAlign:"right"}]}>Cant.</Text>
              <Text style={[s.tHTxt,{width:"8%",textAlign:"center"}]}>Unidad</Text>
              <Text style={[s.tHTxt,{width:"10%",textAlign:"right"}]}>kg</Text>
              <Text style={[s.tHTxt,{width:"13%",textAlign:"right"}]}>Valor USD</Text>
            </View>
            {items.map((item,i)=>(
              <View key={item.id} style={i%2===0?s.tRow:s.tRowAlt}>
                <View style={{flex:1}}>
                  <Text style={[s.cell,{fontWeight:"bold"}]}>{item.description}</Text>
                  {item.country_of_origin&&<Text style={[s.cell,{color:MID,fontSize:7}]}>País origen: {item.country_of_origin}</Text>}
                </View>
                <Text style={[s.cell,{width:"14%",color:MID}]}>{item.tariff_code??"—"}</Text>
                <Text style={[s.cell,{width:"9%",textAlign:"right"}]}>{item.quantity}</Text>
                <Text style={[s.cell,{width:"8%",textAlign:"center",color:MID}]}>{item.unit}</Text>
                <Text style={[s.cell,{width:"10%",textAlign:"right"}]}>{item.weight_kg}</Text>
                <Text style={[s.cell,{width:"13%",textAlign:"right",fontWeight:"bold"}]}>{item.commercial_value>0?`$${item.commercial_value}`:"—"}</Text>
              </View>
            ))}
          </View>
        )}
        {order.special_instructions&&<View style={{backgroundColor:"#fffbeb",padding:"7 10",borderRadius:3,borderLeftWidth:3,borderLeftColor:WARN,marginTop:5}}><Text style={{fontSize:7.5,fontWeight:"bold",color:WARN,marginBottom:2}}>Instrucciones al agente aduanal</Text><Text style={{fontSize:8,color:DARK,lineHeight:1.5}}>{order.special_instructions}</Text></View>}
        <View style={{flexDirection:"row",gap:24,marginTop:16}}>
          {["Autoriza (Empresa)","Agente Aduanal","Recibido"].map(l=><View key={l} style={{flex:1,borderTopWidth:1,borderTopColor:BORDER,paddingTop:5}}><Text style={{fontSize:7,color:MID,textAlign:"center"}}>{l}</Text></View>)}
        </View>
      </View>
      <View style={s.footer}><Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc??""}</Text><Text style={s.fTxt}>{order.shipment?.reference??""}</Text></View>
    </Page></Document>
  );
}
