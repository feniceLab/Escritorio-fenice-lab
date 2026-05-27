"""
GERADOR DE RELATÓRIO PDF — ASSESSORIA DE MARKETING
Uso: este script é gerado automaticamente pelo Claude a cada relatório.
Basta colar os dados do cliente e rodar.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image, HRFlowable, KeepTogether)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import io
import os

# ============================================================
# DADOS DO CLIENTE — EDITE AQUI
# ============================================================

CLIENTE_NOME   = "Mestre do Frango"
CLIENTE_CIDADE = "Passo Fundo · RS"
PERIODO        = "01/03/2026 a 11/03/2026"
DATA_GERACAO   = "12/03/2026"
ARQUIVO_SAIDA  = "RELATORIO_MDF_PF_20260301_20260311.pdf"

# Dados do cardápio digital
CARDAPIO = {
    "faturamento_total": "R$ 6.914,14",
    "total_pedidos": "70",
    "cancelamentos": "0",
    "novos_clientes": "33",
    "recorrentes": "42",
    "delivery_valor": "R$ 4.872,44",
    "delivery_pedidos": "46",
    "delivery_pct": "70,5",
    "retirada_valor": "R$ 2.041,70",
    "retirada_pedidos": "24",
    "retirada_pct": "29,5",
    # Valores numéricos para gráficos
    "delivery_num": 4872.44,
    "retirada_num": 2041.70,
    "novos_num": 33,
    "recorrentes_num": 42,
    "faturamento_num": 6914.14,
}

# Campanhas
CAMPANHAS = [
    {
        "nome": "Perfil · Aquisição",
        "badge": "TOPO DE FUNIL",
        "tipo": "aquisicao",  # aquisicao | conversao
        "stats_row1": [
            ("15.846", "Alcance"),
            ("34.384", "Impressões"),
            ("525",    "Visitas perfil"),
            ("R$ 0,21","Custo/visita"),
        ],
        "stats_row2": [
            ("1",         "Compras"),
            ("R$ 68,99",  "Receita"),
            ("R$ 111,61", "CPA"),
            ("0,62×",     "ROAS", False, True),  # (val, lbl, green, amber)
        ],
        "obs": "Campanha de reconhecimento e expansão de público. Vendas diretas são ganho adicional — o valor principal está no público qualificado que alimenta as campanhas de conversão.",
        "roas_valor": 0.62,
        "roas_max": 15.0,  # máximo da escala visual
    },
    {
        "nome": "Vendas · Performance 01",
        "badge": "CONVERSÃO",
        "tipo": "conversao",
        "stats_row1": [
            ("12.485",    "Alcance"),
            ("29.140",    "Impressões"),
            ("31",        "Carrinhos"),
            ("16",        "Compras"),
        ],
        "stats_row2": [
            ("R$ 1.791,74","Receita"),
            ("R$ 111,98",  "Ticket médio"),
            ("R$ 7,90",    "CPA"),
            ("14,17×",     "ROAS", True, False),
        ],
        "obs": "Melhor ROAS histórico dessa campanha. Cada R$ 1 investido retornou R$ 14,17 em vendas. Ticket médio de R$ 111,98.",
        "roas_valor": 14.17,
        "roas_max": 15.0,
    },
    {
        "nome": "Vendas · Performance 02",
        "badge": "MENOR CPA · ESCALA",
        "tipo": "conversao",
        "stats_row1": [
            ("11.448",    "Alcance"),
            ("27.365",    "Impressões"),
            ("24",        "Carrinhos"),
            ("17",        "Compras"),
        ],
        "stats_row2": [
            ("R$ 1.395,76","Receita"),
            ("R$ 82,10",   "Ticket médio"),
            ("R$ 6,79",    "CPA", True, False),
            ("12,08×",     "ROAS", True, False),
        ],
        "obs": "Menor CPA da operação (R$ 6,79). Maior volume de compras no período. Candidata prioritária para escala gradual.",
        "roas_valor": 12.08,
        "roas_max": 15.0,
    },
]

# Consolidado
CONSOLIDADO = [
    ("R$ 353,56",   "Investimento total",  "",                   False),
    ("R$ 3.256,49", "Receita rastreada",   "47% do fat. real",   False),
    ("9,21×",       "ROAS consolidado",    "Melhor da operação", True),
    ("R$ 10,40",    "CPA médio",           "",                   False),
    ("34",          "Compras rastreadas",  "",                   False),
    ("R$ 95,78",    "Ticket médio",        "",                   False),
]
RECEITA_RASTREADA_NUM = 3256.49

# Leitura estratégica
INSIGHTS = [
    ("verde", "ROAS consolidado de <b>9,21×</b> — melhor da operação desde o início. Campanhas de conversão operam acima de 12× de retorno com CPA abaixo de R$ 8. Estrutura madura, eficiente e com espaço claro para escala."),
    ("azul",  "Ticket médio subiu para R$ 95,78, continuando a tendência de crescimento: R$ 73 → R$ 78 → R$ 85 → R$ 95. Base de clientes com equilíbrio saudável entre novos e recorrentes — produto validado e boa experiência de compra."),
]

# Direcionamento
DIRECIONAMENTOS = [
    ("verde", "Avançar escala gradual nas campanhas de performance — especialmente <b>Vendas 02</b>, com menor CPA da operação (R$ 6,79)"),
    ("verde", "Manter campanha de aquisição ativa para continuar alimentando o público qualificado das campanhas de conversão"),
    ("verde", "Iniciar estruturação de <b>remarketing</b> para recuperação de carrinhos e reativação da base recorrente"),
    ("azul",  "Monitorar evolução do ticket médio — tendência de alta pode indicar oportunidade de ampliar combos ou ofertas de maior valor"),
]

# ============================================================
# ENGINE DE GERAÇÃO — NÃO EDITE ABAIXO
# ============================================================

W, H = A4
UW = W - 36*mm

CG_DARK  = colors.HexColor('#3B6D11')
CG_LIGHT = colors.HexColor('#EAF3DE')
CB       = colors.HexColor('#378ADD')
CB_LIGHT = colors.HexColor('#E6F1FB')
CA       = colors.HexColor('#854F0B')
CA_LIGHT = colors.HexColor('#FAEEDA')
CGRAY    = colors.HexColor('#5F5E5A')
CGRAY_L  = colors.HexColor('#F1EFE8')
CTEXT    = colors.HexColor('#2C2C2A')
CBORDER  = colors.HexColor('#D3D1C7')
CORANGE  = colors.HexColor('#D85A30')
CG_MID   = colors.HexColor('#1D9E75')

def fig_to_img(fig, w_pt, h_pt):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=w_pt, height=h_pt)

def donut_chart(vals, labels, clrs, title, w_pt, h_pt):
    fig, ax = plt.subplots(figsize=(w_pt/72, h_pt/72))
    ax.pie(vals, colors=clrs, startangle=90, wedgeprops=dict(width=0.52, edgecolor='white', linewidth=2))
    ax.set_title(title, fontsize=9, color='#5F5E5A', pad=6)
    patches = [plt.Rectangle((0,0),1,1,color=c) for c in clrs]
    ax.legend(patches, [f'{l}  {v}' for l,v in zip(labels,vals)],
              loc='lower center', ncol=2, fontsize=8, frameon=False, bbox_to_anchor=(0.5,-0.22))
    fig.patch.set_facecolor('white')
    return fig_to_img(fig, w_pt, h_pt)

def hbar_chart(vals, labels, clrs, title, w_pt, h_pt):
    fig, ax = plt.subplots(figsize=(w_pt/72, h_pt/72))
    y = np.arange(len(labels))
    bars = ax.barh(y, vals, color=clrs, height=0.5, edgecolor='none')
    ax.set_yticks(y); ax.set_yticklabels(labels, fontsize=9, color='#2C2C2A')
    ax.xaxis.set_visible(False)
    for sp in ['top','right','bottom']: ax.spines[sp].set_visible(False)
    ax.spines['left'].set_color('#D3D1C7')
    mx = max(vals)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_width()+mx*0.03, bar.get_y()+bar.get_height()/2,
                f'R$ {v:,.2f}', va='center', fontsize=9, color='#2C2C2A', fontweight='bold')
    ax.set_xlim(0, mx*1.45)
    ax.set_title(title, fontsize=8.5, color='#5F5E5A', loc='left', pad=5)
    fig.patch.set_facecolor('white')
    plt.tight_layout(pad=0.4)
    return fig_to_img(fig, w_pt, h_pt)

def roas_bars(camps, roas_vals, w_pt, h_pt):
    fig, ax = plt.subplots(figsize=(w_pt/72, h_pt/72))
    x = np.arange(len(camps))
    clrs = ['#3B6D11' if r>=5 else '#854F0B' for r in roas_vals]
    bars = ax.bar(x, roas_vals, color=clrs, width=0.45, edgecolor='none', zorder=3)
    ax.axhline(5, color='#D3D1C7', lw=1, ls='--', zorder=2, label='Mínimo saudável (5×)')
    ax.set_xticks(x); ax.set_xticklabels(camps, fontsize=10, color='#2C2C2A')
    ax.yaxis.set_visible(False)
    for sp in ['top','right','left']: ax.spines[sp].set_visible(False)
    ax.spines['bottom'].set_color('#D3D1C7')
    for bar, v in zip(bars, roas_vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.3,
                f'{v:.2f}×', ha='center', va='bottom', fontsize=11, fontweight='bold', color='#2C2C2A')
    ax.set_ylim(0, max(roas_vals)*1.28)
    ax.legend(fontsize=8, frameon=False, loc='upper right')
    ax.set_title('ROAS por campanha', fontsize=9, color='#5F5E5A', loc='left', pad=5)
    fig.patch.set_facecolor('white')
    plt.tight_layout(pad=0.4)
    return fig_to_img(fig, w_pt, h_pt)

def ps(name, **kw):
    return ParagraphStyle(name, **kw)

S = {
    'tag':    ps('tag',    fontSize=8,   textColor=CGRAY,   fontName='Helvetica',      spaceAfter=2),
    'title':  ps('title',  fontSize=21,  textColor=CTEXT,   fontName='Helvetica-Bold', spaceAfter=3),
    'period': ps('period', fontSize=11,  textColor=CGRAY,   fontName='Helvetica',      spaceAfter=14),
    'sec':    ps('sec',    fontSize=8,   textColor=CGRAY,   fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=6, leading=10),
    'obs':    ps('obs',    fontSize=8,   textColor=CGRAY,   fontName='Helvetica',      leading=12),
    'insight':ps('insight',fontSize=9.5, textColor=CTEXT,   fontName='Helvetica',      leading=15, leftIndent=10),
    'footer': ps('footer', fontSize=7.5, textColor=CGRAY,   fontName='Helvetica',      alignment=TA_CENTER),
    'mv':     ps('mv',     fontSize=18,  textColor=CTEXT,   fontName='Helvetica-Bold', leading=22, alignment=TA_CENTER),
    'mv_g':   ps('mv_g',   fontSize=18,  textColor=CG_DARK, fontName='Helvetica-Bold', leading=22, alignment=TA_CENTER),
    'ml':     ps('ml',     fontSize=8,   textColor=CGRAY,   fontName='Helvetica',      leading=10, alignment=TA_CENTER),
    'ms':     ps('ms',     fontSize=7.5, textColor=CGRAY,   fontName='Helvetica',      leading=10, alignment=TA_CENTER),
    'cv':     ps('cv',     fontSize=11,  textColor=CTEXT,   fontName='Helvetica-Bold', leading=14, alignment=TA_CENTER),
    'cv_g':   ps('cv_g',   fontSize=11,  textColor=CG_DARK, fontName='Helvetica-Bold', leading=14, alignment=TA_CENTER),
    'cv_a':   ps('cv_a',   fontSize=11,  textColor=CA,      fontName='Helvetica-Bold', leading=14, alignment=TA_CENTER),
    'cl':     ps('cl',     fontSize=7.5, textColor=CGRAY,   fontName='Helvetica',      leading=10, alignment=TA_CENTER),
    'cn':     ps('cn',     fontSize=10,  textColor=CTEXT,   fontName='Helvetica-Bold', leading=13),
    'dir':    ps('dir',    fontSize=9.5, textColor=CTEXT,   fontName='Helvetica',      leading=15, leftIndent=14),
}

def hr_line(color=CBORDER, t=0.5):
    return HRFlowable(width='100%', thickness=t, color=color, spaceAfter=8, spaceBefore=2)

def metric_block(val, lbl, sub, green, cw):
    items = [[Paragraph(val, S['mv_g'] if green else S['mv'])], [Paragraph(lbl, S['ml'])]]
    if sub: items.append([Paragraph(sub, S['ms'])])
    t = Table(items, colWidths=[cw-10])
    t.setStyle(TableStyle([
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),1),('RIGHTPADDING',(0,0),(-1,-1),1),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
    ]))
    return t

def camp_stat(val, lbl, green=False, amber=False, cw=60):
    vst = S['cv_g'] if green else (S['cv_a'] if amber else S['cv'])
    t = Table([[Paragraph(val,vst)],[Paragraph(lbl,S['cl'])]], colWidths=[cw-6])
    t.setStyle(TableStyle([
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
        ('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2),
    ]))
    return t

def campaign_card(camp_data):
    nome     = camp_data['nome']
    badge    = camp_data['badge']
    tipo     = camp_data['tipo']
    row1     = camp_data['stats_row1']
    row2     = camp_data['stats_row2']
    obs      = camp_data['obs']
    roas_val = camp_data['roas_valor']
    roas_max = camp_data['roas_max']

    bbg = CB_LIGHT if tipo == 'aquisicao' else CG_LIGHT
    bfg = CB       if tipo == 'aquisicao' else CG_DARK
    roas_pct = min(roas_val / roas_max, 1.0)

    PAD = 10
    iw  = UW - PAD*2
    nc  = len(row1)
    cw  = iw / nc

    hdr = Table([[
        Paragraph(f'<b>{nome}</b>', S['cn']),
        Paragraph(f'<b>{badge}</b>', ps('bdg', fontSize=8, fontName='Helvetica-Bold',
                   textColor=bfg, alignment=TA_RIGHT, backColor=bbg, borderPadding=3, leading=12)),
    ]], colWidths=[iw*0.62, iw*0.38])
    hdr.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),6),
    ]))

    def make_stats(data, topline=False):
        cells = [camp_stat(*c, cw=cw) for c in data]
        t = Table([cells], colWidths=[cw]*nc, rowHeights=[40])
        cmds = [
            ('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('LEFTPADDING',(0,0),(-1,-1),2),('RIGHTPADDING',(0,0),(-1,-1),2),
            ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ]
        for i in range(1,nc): cmds.append(('LINEBEFORE',(i,0),(i,0),0.5,CBORDER))
        if topline: cmds.append(('LINEABOVE',(0,0),(-1,0),0.5,CBORDER))
        t.setStyle(TableStyle(cmds))
        return t

    r1 = make_stats(row1)
    r2 = make_stats(row2, topline=True)

    fw = max(iw * roas_pct, 2)
    ew = iw - fw
    bar_cols = [fw, ew] if ew > 0 else [fw]
    bar_cells = [[Table([['']], colWidths=[fw], rowHeights=[5]),
                  Table([['']], colWidths=[ew], rowHeights=[5])]] if ew > 0 else \
                [[Table([['']], colWidths=[fw], rowHeights=[5])]]
    bar = Table(bar_cells, colWidths=bar_cols, rowHeights=[5])
    bc = [('BACKGROUND',(0,0),(0,0),CG_DARK),
          ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
          ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]
    if ew > 0: bc.append(('BACKGROUND',(1,0),(1,0),CBORDER))
    bar.setStyle(TableStyle(bc))

    inner = Table([[hdr],[r1],[r2],[Spacer(1,6)],[bar],[Spacer(1,4)],
                   [Paragraph(obs,S['obs'])]], colWidths=[iw])
    inner.setStyle(TableStyle([
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
    ]))
    outer = Table([[inner]], colWidths=[UW])
    outer.setStyle(TableStyle([
        ('BOX',(0,0),(-1,-1),0.5,CBORDER),
        ('LEFTPADDING',(0,0),(-1,-1),PAD),('RIGHTPADDING',(0,0),(-1,-1),PAD),
        ('TOPPADDING',(0,0),(-1,-1),PAD),('BOTTOMPADDING',(0,0),(-1,-1),PAD),
    ]))
    return KeepTogether([outer, Spacer(1,8)])

def build():
    out = ARQUIVO_SAIDA
    doc = SimpleDocTemplate(out, pagesize=A4,
                            leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=16*mm, bottomMargin=16*mm)
    story = []

    # CABEÇALHO
    ht = Table([[
        Paragraph('ASSESSORIA DE MARKETING · RELATÓRIO SEMANAL', S['tag']),
        Paragraph(PERIODO, ps('pr', fontSize=8, textColor=CGRAY, fontName='Helvetica', alignment=TA_RIGHT)),
    ]], colWidths=[UW*0.6, UW*0.4])
    ht.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    story += [ht, Paragraph(CLIENTE_NOME, S['title']),
              Paragraph(CLIENTE_CIDADE, S['period']), hr_line(CG_DARK, 1.5)]

    # CARDÁPIO
    story.append(Paragraph('RESUMO DO CARDÁPIO DIGITAL', S['sec']))
    cw4 = UW / 4
    mdata = [
        (CARDAPIO['faturamento_total'], 'Faturamento real',   'Sistema de pedidos', False),
        (CARDAPIO['total_pedidos'],     'Total de pedidos',   f"{CARDAPIO['cancelamentos']} cancelamentos", False),
        (CARDAPIO['novos_clientes'],    'Novos clientes',     'Aquisição ativa',    False),
        (CARDAPIO['recorrentes'],       'Recorrentes',        'Base fidelizada',    False),
    ]
    mt = Table([[metric_block(v,l,sb,g,cw4) for v,l,sb,g in mdata]],
               colWidths=[cw4]*4, rowHeights=[64])
    mt.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),CGRAY_L),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LINEBEFORE',(1,0),(3,0),0.5,CBORDER),
    ]))
    story += [mt, Spacer(1,8)]

    # CANAIS
    cw2 = UW / 2
    def ch_inner(titulo, valor, pedidos, pct, tcolor):
        t = Table([
            [Paragraph(titulo, ps('cht', fontSize=8, fontName='Helvetica-Bold', textColor=tcolor))],
            [Paragraph(valor,  ps('chv', fontSize=14,fontName='Helvetica-Bold', textColor=CTEXT))],
            [Paragraph(f'{pedidos} pedidos · {pct}% do faturamento', S['obs'])],
        ], colWidths=[cw2-24])
        t.setStyle(TableStyle([
            ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
            ('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2),
        ]))
        return t
    ct = Table([[
        ch_inner('DELIVERY', CARDAPIO['delivery_valor'], CARDAPIO['delivery_pedidos'], CARDAPIO['delivery_pct'], CB),
        ch_inner('RETIRADA', CARDAPIO['retirada_valor'], CARDAPIO['retirada_pedidos'], CARDAPIO['retirada_pct'], CORANGE),
    ]], colWidths=[cw2,cw2])
    ct.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(0,-1),CB_LIGHT),
        ('BACKGROUND',(1,0),(1,-1),colors.HexColor('#FAECE7')),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),
        ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),
        ('LINEAFTER',(0,0),(0,-1),0.5,CBORDER),
    ]))
    story += [ct, Spacer(1,10), hr_line()]

    # CAMPANHAS
    story.append(Paragraph('DESEMPENHO DAS CAMPANHAS — META ADS', S['sec']))
    for camp in CAMPANHAS:
        story.append(campaign_card(camp))
    story.append(hr_line())

    # CONSOLIDADO
    story.append(Paragraph('CONSOLIDADO DO TRÁFEGO PAGO', S['sec']))
    cw3 = UW / 3
    rows_c = []
    for i in range(0, len(CONSOLIDADO), 3):
        rows_c.append([metric_block(v,l,sb,g,cw3) for v,l,sb,g in CONSOLIDADO[i:i+3]])
    ct2 = Table(rows_c, colWidths=[cw3]*3, rowHeights=[64]*len(rows_c))
    ct2.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),CGRAY_L),
        ('BACKGROUND',(2,0),(2,0),CG_LIGHT),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LINEBEFORE',(1,0),(2,-1),0.5,CBORDER),
        ('LINEBELOW',(0,0),(-1,0),0.5,CBORDER),
    ]))
    story += [ct2, Spacer(1,10)]

    # GRÁFICOS
    camp_names  = [c['nome'].split('·')[1].strip() if '·' in c['nome'] else c['nome'] for c in CAMPANHAS]
    roas_values = [c['roas_valor'] for c in CAMPANHAS]
    g_roas = roas_bars(camp_names, roas_values, w_pt=UW, h_pt=130)
    story += [g_roas, Spacer(1,8)]

    d_col = UW * 0.27; gf_col = UW * 0.46
    d1 = donut_chart([CARDAPIO['delivery_num'], CARDAPIO['retirada_num']],
                     ['Delivery','Retirada'], ['#378ADD','#D85A30'], 'Canais de venda', d_col, 120)
    d2 = donut_chart([CARDAPIO['novos_num'], CARDAPIO['recorrentes_num']],
                     ['Novos','Recorrentes'], ['#1D9E75','#BA7517'], 'Clientes', d_col, 120)
    gf = hbar_chart([RECEITA_RASTREADA_NUM, CARDAPIO['faturamento_num']],
                    ['Receita rastreada','Faturamento real'],
                    ['#1D9E75','#378ADD'], 'Rastreado vs faturamento real', gf_col, 90)
    gt = Table([[d1,d2,gf]], colWidths=[d_col,d_col,gf_col])
    gt.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story += [gt, Spacer(1,8), hr_line()]

    # LEITURA ESTRATÉGICA
    story.append(Paragraph('LEITURA ESTRATÉGICA', S['sec']))
    for cor, txt in INSIGHTS:
        bar_c = CG_DARK if cor == 'verde' else CB
        it = Table([[
            Paragraph('', ps('sp')),
            Paragraph(txt, S['insight']),
        ]], colWidths=[8, UW-8])
        it.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(0,-1),bar_c),
            ('BACKGROUND',(1,0),(1,-1),CGRAY_L),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('LEFTPADDING',(0,0),(0,-1),0),('RIGHTPADDING',(0,0),(0,-1),0),
            ('LEFTPADDING',(1,0),(1,-1),10),('RIGHTPADDING',(1,0),(1,-1),10),
            ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),
        ]))
        story += [it, Spacer(1,6)]

    story += [Spacer(1,4), hr_line()]

    # DIRECIONAMENTO
    story.append(Paragraph('DIRECIONAMENTO ESTRATÉGICO', S['sec']))
    for cor, txt in DIRECIONAMENTOS:
        dot_c = CG_DARK if cor == 'verde' else CB
        dot = Table([['']], colWidths=[6], rowHeights=[6])
        dot.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),dot_c)]))
        row = Table([[dot, Paragraph(txt, S['dir'])]], colWidths=[16, UW-16])
        row.setStyle(TableStyle([
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
            ('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('LINEBELOW',(0,0),(-1,-1),0.5,CBORDER),
        ]))
        story += [row, Spacer(1,2)]

    story += [
        Spacer(1,16), hr_line(CBORDER,0.5),
        Paragraph(f'Dados: Meta Ads + sistema de cardápio digital  ·  Período: {PERIODO}  ·  Gerado em {DATA_GERACAO}', S['footer']),
    ]

    doc.build(story)
    print(f'✓ PDF gerado: {out}')

if __name__ == '__main__':
    build()
