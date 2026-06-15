from rest_framework import serializers
from parts.models import Customer, SiteSurvey, SurveyItem, Quotation, QuotationItem, Attachment, HistoryRecord

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'contact', 'phone', 'address', 'created_at']

class SurveyItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyItem
        fields = ['id', 'item_type', 'description', 'quantity', 'dimensions', 'material_requirements', 'installation_requirements']

class SiteSurveySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    surveyor_name = serializers.CharField(source='surveyor.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = SurveyItemSerializer(many=True, read_only=True)
    has_quotation = serializers.SerializerMethodField()
    
    def get_has_quotation(self, obj):
        return hasattr(obj, 'quotation')
    
    class Meta:
        model = SiteSurvey
        fields = [
            'id', 'survey_no', 'customer', 'customer_name', 'survey_date', 'location',
            'building_type', 'floor_count', 'wall_material', 'power_supply', 
            'installation_height', 'access_condition', 'photos', 'notes',
            'status', 'status_display', 'surveyor', 'surveyor_name',
            'created_at', 'updated_at', 'items', 'has_quotation'
        ]

class SurveyCreateSerializer(serializers.ModelSerializer):
    items = SurveyItemSerializer(many=True, required=False)
    
    class Meta:
        model = SiteSurvey
        fields = [
            'customer', 'survey_date', 'location', 'building_type', 'floor_count',
            'wall_material', 'power_supply', 'installation_height', 'access_condition',
            'photos', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        survey = SiteSurvey.objects.create(**validated_data)
        for item_data in items_data:
            SurveyItem.objects.create(survey=survey, **item_data)
        return survey

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = ['id', 'item_name', 'item_type', 'quantity', 'unit_price', 'total_price', 'material', 'process', 'installation_fee']

class QuotationSerializer(serializers.ModelSerializer):
    survey_no = serializers.CharField(source='survey.survey_no', read_only=True)
    customer_name = serializers.CharField(source='survey.customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    items = QuotationItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_no', 'survey', 'survey_no', 'customer_name',
            'quotation_date', 'valid_until', 'status', 'status_display',
            'total_amount', 'discount', 'final_amount',
            'payment_terms', 'delivery_time', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'items'
        ]

class QuotationCreateSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    
    class Meta:
        model = Quotation
        fields = [
            'survey', 'valid_until', 'total_amount', 'discount', 'final_amount',
            'payment_terms', 'delivery_time', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    
    class Meta:
        model = Attachment
        fields = ['id', 'file_name', 'file_path', 'file_type', 'file_type_display', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']

class HistoryRecordSerializer(serializers.ModelSerializer):
    history_type_display = serializers.CharField(source='get_history_type_display', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    
    class Meta:
        model = HistoryRecord
        fields = ['id', 'history_type', 'history_type_display', 'description', 'changed_fields', 'operator', 'operator_name', 'created_at']

class TodoItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    type = serializers.CharField()
    priority = serializers.CharField()
    due_date = serializers.DateTimeField()
    customer_name = serializers.CharField()

class RiskItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    type = serializers.CharField()
    level = serializers.CharField()
    customer_name = serializers.CharField()
    created_at = serializers.DateTimeField()

class ChangeItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    type = serializers.CharField()
    operator = serializers.CharField()
    created_at = serializers.DateTimeField()