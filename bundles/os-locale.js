import child_process from 'child_process';

var invertKv = function (obj) {
	if (typeof obj !== 'object') {
		throw new TypeError('Expected an object');
	}

	var ret = {};

	for (var key in obj) {
		var val = obj[key];
		ret[val] = key;
	}

	return ret;
};

var af_ZA = 1078;
var am_ET = 1118;
var ar_AE = 14337;
var ar_BH = 15361;
var ar_DZ = 5121;
var ar_EG = 3073;
var ar_IQ = 2049;
var ar_JO = 11265;
var ar_KW = 13313;
var ar_LB = 12289;
var ar_LY = 4097;
var ar_MA = 6145;
var ar_OM = 8193;
var ar_QA = 16385;
var ar_SA = 1025;
var ar_SY = 10241;
var ar_TN = 7169;
var ar_YE = 9217;
var arn_CL = 1146;
var as_IN = 1101;
var az_AZ = 2092;
var ba_RU = 1133;
var be_BY = 1059;
var bg_BG = 1026;
var bn_IN = 1093;
var bo_BT = 2129;
var bo_CN = 1105;
var br_FR = 1150;
var bs_BA = 8218;
var ca_ES = 1027;
var co_FR = 1155;
var cs_CZ = 1029;
var cy_GB = 1106;
var da_DK = 1030;
var de_AT = 3079;
var de_CH = 2055;
var de_DE = 1031;
var de_LI = 5127;
var de_LU = 4103;
var div_MV = 1125;
var dsb_DE = 2094;
var el_GR = 1032;
var en_AU = 3081;
var en_BZ = 10249;
var en_CA = 4105;
var en_CB = 9225;
var en_GB = 2057;
var en_IE = 6153;
var en_IN = 18441;
var en_JA = 8201;
var en_MY = 17417;
var en_NZ = 5129;
var en_PH = 13321;
var en_TT = 11273;
var en_US = 1033;
var en_ZA = 7177;
var en_ZW = 12297;
var es_AR = 11274;
var es_BO = 16394;
var es_CL = 13322;
var es_CO = 9226;
var es_CR = 5130;
var es_DO = 7178;
var es_EC = 12298;
var es_ES = 3082;
var es_GT = 4106;
var es_HN = 18442;
var es_MX = 2058;
var es_NI = 19466;
var es_PA = 6154;
var es_PE = 10250;
var es_PR = 20490;
var es_PY = 15370;
var es_SV = 17418;
var es_UR = 14346;
var es_US = 21514;
var es_VE = 8202;
var et_EE = 1061;
var eu_ES = 1069;
var fa_IR = 1065;
var fi_FI = 1035;
var fil_PH = 1124;
var fo_FO = 1080;
var fr_BE = 2060;
var fr_CA = 3084;
var fr_CH = 4108;
var fr_FR = 1036;
var fr_LU = 5132;
var fr_MC = 6156;
var fy_NL = 1122;
var ga_IE = 2108;
var gbz_AF = 1164;
var gl_ES = 1110;
var gsw_FR = 1156;
var gu_IN = 1095;
var ha_NG = 1128;
var he_IL = 1037;
var hi_IN = 1081;
var hr_BA = 4122;
var hr_HR = 1050;
var hu_HU = 1038;
var hy_AM = 1067;
var id_ID = 1057;
var ii_CN = 1144;
var is_IS = 1039;
var it_CH = 2064;
var it_IT = 1040;
var iu_CA = 2141;
var ja_JP = 1041;
var ka_GE = 1079;
var kh_KH = 1107;
var kk_KZ = 1087;
var kl_GL = 1135;
var kn_IN = 1099;
var ko_KR = 1042;
var kok_IN = 1111;
var ky_KG = 1088;
var lb_LU = 1134;
var lo_LA = 1108;
var lt_LT = 1063;
var lv_LV = 1062;
var mi_NZ = 1153;
var mk_MK = 1071;
var ml_IN = 1100;
var mn_CN = 2128;
var mn_MN = 1104;
var moh_CA = 1148;
var mr_IN = 1102;
var ms_BN = 2110;
var ms_MY = 1086;
var mt_MT = 1082;
var my_MM = 1109;
var nb_NO = 1044;
var ne_NP = 1121;
var nl_BE = 2067;
var nl_NL = 1043;
var nn_NO = 2068;
var ns_ZA = 1132;
var oc_FR = 1154;
var or_IN = 1096;
var pa_IN = 1094;
var pl_PL = 1045;
var ps_AF = 1123;
var pt_BR = 1046;
var pt_PT = 2070;
var qut_GT = 1158;
var quz_BO = 1131;
var quz_EC = 2155;
var quz_PE = 3179;
var rm_CH = 1047;
var ro_RO = 1048;
var ru_RU = 1049;
var rw_RW = 1159;
var sa_IN = 1103;
var sah_RU = 1157;
var se_FI = 3131;
var se_NO = 1083;
var se_SE = 2107;
var si_LK = 1115;
var sk_SK = 1051;
var sl_SI = 1060;
var sma_NO = 6203;
var sma_SE = 7227;
var smj_NO = 4155;
var smj_SE = 5179;
var smn_FI = 9275;
var sms_FI = 8251;
var sq_AL = 1052;
var sr_BA = 7194;
var sr_SP = 3098;
var sv_FI = 2077;
var sv_SE = 1053;
var sw_KE = 1089;
var syr_SY = 1114;
var ta_IN = 1097;
var te_IN = 1098;
var tg_TJ = 1064;
var th_TH = 1054;
var tk_TM = 1090;
var tmz_DZ = 2143;
var tn_ZA = 1074;
var tr_TR = 1055;
var tt_RU = 1092;
var ug_CN = 1152;
var uk_UA = 1058;
var ur_IN = 2080;
var ur_PK = 1056;
var uz_UZ = 2115;
var vi_VN = 1066;
var wen_DE = 1070;
var wo_SN = 1160;
var xh_ZA = 1076;
var yo_NG = 1130;
var zh_CHS = 4;
var zh_CHT = 31748;
var zh_CN = 2052;
var zh_HK = 3076;
var zh_MO = 5124;
var zh_SG = 4100;
var zh_TW = 1028;
var zu_ZA = 1077;
var lcid = {
	af_ZA: af_ZA,
	am_ET: am_ET,
	ar_AE: ar_AE,
	ar_BH: ar_BH,
	ar_DZ: ar_DZ,
	ar_EG: ar_EG,
	ar_IQ: ar_IQ,
	ar_JO: ar_JO,
	ar_KW: ar_KW,
	ar_LB: ar_LB,
	ar_LY: ar_LY,
	ar_MA: ar_MA,
	ar_OM: ar_OM,
	ar_QA: ar_QA,
	ar_SA: ar_SA,
	ar_SY: ar_SY,
	ar_TN: ar_TN,
	ar_YE: ar_YE,
	arn_CL: arn_CL,
	as_IN: as_IN,
	az_AZ: az_AZ,
	ba_RU: ba_RU,
	be_BY: be_BY,
	bg_BG: bg_BG,
	bn_IN: bn_IN,
	bo_BT: bo_BT,
	bo_CN: bo_CN,
	br_FR: br_FR,
	bs_BA: bs_BA,
	ca_ES: ca_ES,
	co_FR: co_FR,
	cs_CZ: cs_CZ,
	cy_GB: cy_GB,
	da_DK: da_DK,
	de_AT: de_AT,
	de_CH: de_CH,
	de_DE: de_DE,
	de_LI: de_LI,
	de_LU: de_LU,
	div_MV: div_MV,
	dsb_DE: dsb_DE,
	el_GR: el_GR,
	en_AU: en_AU,
	en_BZ: en_BZ,
	en_CA: en_CA,
	en_CB: en_CB,
	en_GB: en_GB,
	en_IE: en_IE,
	en_IN: en_IN,
	en_JA: en_JA,
	en_MY: en_MY,
	en_NZ: en_NZ,
	en_PH: en_PH,
	en_TT: en_TT,
	en_US: en_US,
	en_ZA: en_ZA,
	en_ZW: en_ZW,
	es_AR: es_AR,
	es_BO: es_BO,
	es_CL: es_CL,
	es_CO: es_CO,
	es_CR: es_CR,
	es_DO: es_DO,
	es_EC: es_EC,
	es_ES: es_ES,
	es_GT: es_GT,
	es_HN: es_HN,
	es_MX: es_MX,
	es_NI: es_NI,
	es_PA: es_PA,
	es_PE: es_PE,
	es_PR: es_PR,
	es_PY: es_PY,
	es_SV: es_SV,
	es_UR: es_UR,
	es_US: es_US,
	es_VE: es_VE,
	et_EE: et_EE,
	eu_ES: eu_ES,
	fa_IR: fa_IR,
	fi_FI: fi_FI,
	fil_PH: fil_PH,
	fo_FO: fo_FO,
	fr_BE: fr_BE,
	fr_CA: fr_CA,
	fr_CH: fr_CH,
	fr_FR: fr_FR,
	fr_LU: fr_LU,
	fr_MC: fr_MC,
	fy_NL: fy_NL,
	ga_IE: ga_IE,
	gbz_AF: gbz_AF,
	gl_ES: gl_ES,
	gsw_FR: gsw_FR,
	gu_IN: gu_IN,
	ha_NG: ha_NG,
	he_IL: he_IL,
	hi_IN: hi_IN,
	hr_BA: hr_BA,
	hr_HR: hr_HR,
	hu_HU: hu_HU,
	hy_AM: hy_AM,
	id_ID: id_ID,
	ii_CN: ii_CN,
	is_IS: is_IS,
	it_CH: it_CH,
	it_IT: it_IT,
	iu_CA: iu_CA,
	ja_JP: ja_JP,
	ka_GE: ka_GE,
	kh_KH: kh_KH,
	kk_KZ: kk_KZ,
	kl_GL: kl_GL,
	kn_IN: kn_IN,
	ko_KR: ko_KR,
	kok_IN: kok_IN,
	ky_KG: ky_KG,
	lb_LU: lb_LU,
	lo_LA: lo_LA,
	lt_LT: lt_LT,
	lv_LV: lv_LV,
	mi_NZ: mi_NZ,
	mk_MK: mk_MK,
	ml_IN: ml_IN,
	mn_CN: mn_CN,
	mn_MN: mn_MN,
	moh_CA: moh_CA,
	mr_IN: mr_IN,
	ms_BN: ms_BN,
	ms_MY: ms_MY,
	mt_MT: mt_MT,
	my_MM: my_MM,
	nb_NO: nb_NO,
	ne_NP: ne_NP,
	nl_BE: nl_BE,
	nl_NL: nl_NL,
	nn_NO: nn_NO,
	ns_ZA: ns_ZA,
	oc_FR: oc_FR,
	or_IN: or_IN,
	pa_IN: pa_IN,
	pl_PL: pl_PL,
	ps_AF: ps_AF,
	pt_BR: pt_BR,
	pt_PT: pt_PT,
	qut_GT: qut_GT,
	quz_BO: quz_BO,
	quz_EC: quz_EC,
	quz_PE: quz_PE,
	rm_CH: rm_CH,
	ro_RO: ro_RO,
	ru_RU: ru_RU,
	rw_RW: rw_RW,
	sa_IN: sa_IN,
	sah_RU: sah_RU,
	se_FI: se_FI,
	se_NO: se_NO,
	se_SE: se_SE,
	si_LK: si_LK,
	sk_SK: sk_SK,
	sl_SI: sl_SI,
	sma_NO: sma_NO,
	sma_SE: sma_SE,
	smj_NO: smj_NO,
	smj_SE: smj_SE,
	smn_FI: smn_FI,
	sms_FI: sms_FI,
	sq_AL: sq_AL,
	sr_BA: sr_BA,
	sr_SP: sr_SP,
	sv_FI: sv_FI,
	sv_SE: sv_SE,
	sw_KE: sw_KE,
	syr_SY: syr_SY,
	ta_IN: ta_IN,
	te_IN: te_IN,
	tg_TJ: tg_TJ,
	th_TH: th_TH,
	tk_TM: tk_TM,
	tmz_DZ: tmz_DZ,
	tn_ZA: tn_ZA,
	tr_TR: tr_TR,
	tt_RU: tt_RU,
	ug_CN: ug_CN,
	uk_UA: uk_UA,
	ur_IN: ur_IN,
	ur_PK: ur_PK,
	uz_UZ: uz_UZ,
	vi_VN: vi_VN,
	wen_DE: wen_DE,
	wo_SN: wo_SN,
	xh_ZA: xh_ZA,
	yo_NG: yo_NG,
	zh_CHS: zh_CHS,
	zh_CHT: zh_CHT,
	zh_CN: zh_CN,
	zh_HK: zh_HK,
	zh_MO: zh_MO,
	zh_SG: zh_SG,
	zh_TW: zh_TW,
	zu_ZA: zu_ZA
};

var lcid$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	af_ZA: af_ZA,
	am_ET: am_ET,
	ar_AE: ar_AE,
	ar_BH: ar_BH,
	ar_DZ: ar_DZ,
	ar_EG: ar_EG,
	ar_IQ: ar_IQ,
	ar_JO: ar_JO,
	ar_KW: ar_KW,
	ar_LB: ar_LB,
	ar_LY: ar_LY,
	ar_MA: ar_MA,
	ar_OM: ar_OM,
	ar_QA: ar_QA,
	ar_SA: ar_SA,
	ar_SY: ar_SY,
	ar_TN: ar_TN,
	ar_YE: ar_YE,
	arn_CL: arn_CL,
	as_IN: as_IN,
	az_AZ: az_AZ,
	ba_RU: ba_RU,
	be_BY: be_BY,
	bg_BG: bg_BG,
	bn_IN: bn_IN,
	bo_BT: bo_BT,
	bo_CN: bo_CN,
	br_FR: br_FR,
	bs_BA: bs_BA,
	ca_ES: ca_ES,
	co_FR: co_FR,
	cs_CZ: cs_CZ,
	cy_GB: cy_GB,
	da_DK: da_DK,
	de_AT: de_AT,
	de_CH: de_CH,
	de_DE: de_DE,
	de_LI: de_LI,
	de_LU: de_LU,
	div_MV: div_MV,
	dsb_DE: dsb_DE,
	el_GR: el_GR,
	en_AU: en_AU,
	en_BZ: en_BZ,
	en_CA: en_CA,
	en_CB: en_CB,
	en_GB: en_GB,
	en_IE: en_IE,
	en_IN: en_IN,
	en_JA: en_JA,
	en_MY: en_MY,
	en_NZ: en_NZ,
	en_PH: en_PH,
	en_TT: en_TT,
	en_US: en_US,
	en_ZA: en_ZA,
	en_ZW: en_ZW,
	es_AR: es_AR,
	es_BO: es_BO,
	es_CL: es_CL,
	es_CO: es_CO,
	es_CR: es_CR,
	es_DO: es_DO,
	es_EC: es_EC,
	es_ES: es_ES,
	es_GT: es_GT,
	es_HN: es_HN,
	es_MX: es_MX,
	es_NI: es_NI,
	es_PA: es_PA,
	es_PE: es_PE,
	es_PR: es_PR,
	es_PY: es_PY,
	es_SV: es_SV,
	es_UR: es_UR,
	es_US: es_US,
	es_VE: es_VE,
	et_EE: et_EE,
	eu_ES: eu_ES,
	fa_IR: fa_IR,
	fi_FI: fi_FI,
	fil_PH: fil_PH,
	fo_FO: fo_FO,
	fr_BE: fr_BE,
	fr_CA: fr_CA,
	fr_CH: fr_CH,
	fr_FR: fr_FR,
	fr_LU: fr_LU,
	fr_MC: fr_MC,
	fy_NL: fy_NL,
	ga_IE: ga_IE,
	gbz_AF: gbz_AF,
	gl_ES: gl_ES,
	gsw_FR: gsw_FR,
	gu_IN: gu_IN,
	ha_NG: ha_NG,
	he_IL: he_IL,
	hi_IN: hi_IN,
	hr_BA: hr_BA,
	hr_HR: hr_HR,
	hu_HU: hu_HU,
	hy_AM: hy_AM,
	id_ID: id_ID,
	ii_CN: ii_CN,
	is_IS: is_IS,
	it_CH: it_CH,
	it_IT: it_IT,
	iu_CA: iu_CA,
	ja_JP: ja_JP,
	ka_GE: ka_GE,
	kh_KH: kh_KH,
	kk_KZ: kk_KZ,
	kl_GL: kl_GL,
	kn_IN: kn_IN,
	ko_KR: ko_KR,
	kok_IN: kok_IN,
	ky_KG: ky_KG,
	lb_LU: lb_LU,
	lo_LA: lo_LA,
	lt_LT: lt_LT,
	lv_LV: lv_LV,
	mi_NZ: mi_NZ,
	mk_MK: mk_MK,
	ml_IN: ml_IN,
	mn_CN: mn_CN,
	mn_MN: mn_MN,
	moh_CA: moh_CA,
	mr_IN: mr_IN,
	ms_BN: ms_BN,
	ms_MY: ms_MY,
	mt_MT: mt_MT,
	my_MM: my_MM,
	nb_NO: nb_NO,
	ne_NP: ne_NP,
	nl_BE: nl_BE,
	nl_NL: nl_NL,
	nn_NO: nn_NO,
	ns_ZA: ns_ZA,
	oc_FR: oc_FR,
	or_IN: or_IN,
	pa_IN: pa_IN,
	pl_PL: pl_PL,
	ps_AF: ps_AF,
	pt_BR: pt_BR,
	pt_PT: pt_PT,
	qut_GT: qut_GT,
	quz_BO: quz_BO,
	quz_EC: quz_EC,
	quz_PE: quz_PE,
	rm_CH: rm_CH,
	ro_RO: ro_RO,
	ru_RU: ru_RU,
	rw_RW: rw_RW,
	sa_IN: sa_IN,
	sah_RU: sah_RU,
	se_FI: se_FI,
	se_NO: se_NO,
	se_SE: se_SE,
	si_LK: si_LK,
	sk_SK: sk_SK,
	sl_SI: sl_SI,
	sma_NO: sma_NO,
	sma_SE: sma_SE,
	smj_NO: smj_NO,
	smj_SE: smj_SE,
	smn_FI: smn_FI,
	sms_FI: sms_FI,
	sq_AL: sq_AL,
	sr_BA: sr_BA,
	sr_SP: sr_SP,
	sv_FI: sv_FI,
	sv_SE: sv_SE,
	sw_KE: sw_KE,
	syr_SY: syr_SY,
	ta_IN: ta_IN,
	te_IN: te_IN,
	tg_TJ: tg_TJ,
	th_TH: th_TH,
	tk_TM: tk_TM,
	tmz_DZ: tmz_DZ,
	tn_ZA: tn_ZA,
	tr_TR: tr_TR,
	tt_RU: tt_RU,
	ug_CN: ug_CN,
	uk_UA: uk_UA,
	ur_IN: ur_IN,
	ur_PK: ur_PK,
	uz_UZ: uz_UZ,
	vi_VN: vi_VN,
	wen_DE: wen_DE,
	wo_SN: wo_SN,
	xh_ZA: xh_ZA,
	yo_NG: yo_NG,
	zh_CHS: zh_CHS,
	zh_CHT: zh_CHT,
	zh_CN: zh_CN,
	zh_HK: zh_HK,
	zh_MO: zh_MO,
	zh_SG: zh_SG,
	zh_TW: zh_TW,
	zu_ZA: zu_ZA,
	'default': lcid
});

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

var all = getCjsExportFromNamespace(lcid$1);

var inverted = invertKv(all);

var execFileSync = child_process.execFileSync;
